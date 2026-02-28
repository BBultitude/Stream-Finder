'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { computeDisplayStatus } = require('../utils/displayStatus');

const router = Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Simple in-process cache for detail responses (1-hour TTL)
const detailCache = new Map();
const DETAIL_TTL_MS = 60 * 60 * 1000;

/**
 * GET /api/detail/:type/:id
 * Returns full detail for a content item including:
 *   - imdb_id (from TMDB external_ids)
 *   - trailer_key (best YouTube trailer from TMDB videos)
 *   - recommendations (with streaming info, from TMDB + DB enrichment)
 *
 * API key stays server-side.
 */
router.get('/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const contentId = parseInt(id, 10);

  if (!['movie', 'tv'].includes(type) || !Number.isInteger(contentId) || contentId <= 0) {
    return res.status(400).json({ error: 'Invalid type or id' });
  }

  const cacheKey = `${type}_${contentId}`;
  const cached = detailCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < DETAIL_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY not configured');

    // Fetch external_ids, recommendations, videos, and credits in parallel
    const [externalIds, recsData, videosData, creditsData] = await Promise.all([
      tmdbGet(`/${type}/${contentId}/external_ids`, apiKey),
      fetchRecommendations(type, contentId, apiKey),
      tmdbGet(`/${type}/${contentId}/videos`, apiKey).catch(() => ({ results: [] })),
      tmdbGet(`/${type}/${contentId}/credits`, apiKey).catch(() => ({ cast: [] }))
    ]);

    // Enrich recommendations: prefer DB data (real streaming + display_status).
    // For items not yet in DB, lazily fetch their AU providers from TMDB and store them.
    const db = getDb();
    const recommendations = await enrichRecommendations(db, recsData, type, apiKey);

    const cast = (creditsData.cast || []).slice(0, 6).map(p => ({
      id: p.id,
      name: p.name,
      character: p.character || null,
      profile_path: p.profile_path || null
    }));

    const result = {
      imdb_id: externalIds.imdb_id || null,
      trailer_key: findTrailerKey(videosData),
      recommendations,
      cast
    };

    detailCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    console.error(`[GET /api/detail/${type}/${contentId}]`, err.message);
    res.status(500).json({ imdb_id: null, recommendations: [], error: 'Failed to load detail' });
  }
});

/**
 * Enrich recommendation items with AU streaming data.
 * - Items in our DB: use stored streaming + display_status.
 * - Items NOT in DB: lazily fetch /watch/providers from TMDB, store in DB,
 *   then include the result. The detail cache (1h TTL) ensures this only
 *   runs once per hour per content item.
 */
async function enrichRecommendations(db, recsData, fallbackType, apiKey) {
  if (recsData.length === 0) return [];

  const items = recsData.map(r => ({ ...r, media_type: r.media_type || fallbackType }));

  // Bulk-query any items that exist in our content table
  const movieIds = items.filter(i => i.media_type === 'movie').map(i => i.id);
  const tvIds    = items.filter(i => i.media_type === 'tv').map(i => i.id);
  let dbRows = [];

  if (movieIds.length) {
    const ph = movieIds.map(() => '?').join(',');
    dbRows.push(...db.prepare(`
      SELECT id, media_type, title, overview, poster_path, release_date, vote_average,
        popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification
      FROM content WHERE media_type = 'movie' AND id IN (${ph})
    `).all(...movieIds));
  }
  if (tvIds.length) {
    const ph = tvIds.map(() => '?').join(',');
    dbRows.push(...db.prepare(`
      SELECT id, media_type, title, overview, poster_path, release_date, vote_average,
        popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification
      FROM content WHERE media_type = 'tv' AND id IN (${ph})
    `).all(...tvIds));
  }

  const inDb = new Set(dbRows.map(r => `${r.media_type}:${r.id}`));

  // For items not yet in DB, lazily fetch their AU providers from TMDB and store them
  const unknownItems = items.filter(i => !inDb.has(`${i.media_type}:${i.id}`));
  if (unknownItems.length > 0) {
    await Promise.all(unknownItems.map(item => lazyFetchAndStoreProviders(db, item, apiKey)));

    // Re-query to pick up the newly stored rows
    const newMovieIds = unknownItems.filter(i => i.media_type === 'movie').map(i => i.id);
    const newTvIds    = unknownItems.filter(i => i.media_type === 'tv').map(i => i.id);
    if (newMovieIds.length) {
      const ph = newMovieIds.map(() => '?').join(',');
      dbRows.push(...db.prepare(`
        SELECT id, media_type, title, overview, poster_path, release_date, vote_average,
          popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification
        FROM content WHERE media_type = 'movie' AND id IN (${ph})
      `).all(...newMovieIds));
    }
    if (newTvIds.length) {
      const ph = newTvIds.map(() => '?').join(',');
      dbRows.push(...db.prepare(`
        SELECT id, media_type, title, overview, poster_path, release_date, vote_average,
          popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification
        FROM content WHERE media_type = 'tv' AND id IN (${ph})
      `).all(...newTvIds));
    }

    for (const r of dbRows) inDb.add(`${r.media_type}:${r.id}`);
  }

  const dbRowMap = new Map(dbRows.map(r => [`${r.media_type}:${r.id}`, r]));
  const mergedRows = items.map(item =>
    dbRowMap.get(`${item.media_type}:${item.id}`) || item
  );

  // attachStreamingAndGenres fetches streaming + genres from DB for all items
  const shaped = attachStreamingAndGenres(db, mergedRows);

  // For items still not in DB (lazy fetch failed), clear the 'coming_soon' default.
  // Filter out anything with no AU streaming — no point recommending unwatchable content.
  return shaped
    .map((item, i) => {
      const key = `${mergedRows[i].media_type}:${mergedRows[i].id}`;
      return inDb.has(key) ? item : { ...item, display_status: null };
    })
    .filter(item => item.display_status !== 'unavailable');
}

/**
 * Fetch AU watch/providers for a single recommendation item that isn't in our DB,
 * store the content row and streaming availability, and compute display_status.
 * Uses INSERT OR IGNORE so concurrent requests are safe and existing rows are preserved.
 */
async function lazyFetchAndStoreProviders(db, item, apiKey) {
  const { id, media_type } = item;
  try {
    const now = Date.now();
    const title       = item.title || item.name || 'Unknown';
    const releaseDate = item.release_date || item.first_air_date || null;

    // Insert a basic content row (ignore if already exists from a concurrent request)
    db.prepare(`
      INSERT OR IGNORE INTO content
        (id, media_type, title, overview, poster_path, release_date,
         vote_average, popularity, display_status, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'coming_soon', ?)
    `).run(id, media_type, title, item.overview || '', item.poster_path || null,
           releaseDate, item.vote_average || 0, item.popularity || 0, now);

    // Store genre associations
    if (item.genre_ids?.length) {
      const insertCG = db.prepare(`
        INSERT OR IGNORE INTO content_genres (content_id, content_media_type, genre_id)
        VALUES (?, ?, ?)
      `);
      for (const gid of item.genre_ids) insertCG.run(id, media_type, gid);
    }

    // Fetch AU watch/providers from TMDB
    const data = await tmdbGet(`/${media_type}/${id}/watch/providers`, apiKey);
    const auData = data.results?.AU || {};

    const upsertProvider = db.prepare(`
      INSERT INTO providers (provider_id, provider_name, logo_path)
      VALUES (?, ?, ?)
      ON CONFLICT(provider_id) DO UPDATE SET
        provider_name = excluded.provider_name,
        logo_path     = excluded.logo_path
    `);
    const insertAvail = db.prepare(`
      INSERT INTO streaming_availability
        (content_id, content_media_type, provider_id, region, type, first_seen, last_confirmed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id, content_media_type, provider_id, region, type)
      DO UPDATE SET last_confirmed = excluded.last_confirmed
    `);

    let hasAuFlatrate = false;
    for (const avType of ['flatrate', 'rent', 'buy']) {
      for (const p of auData[avType] || []) {
        upsertProvider.run(p.provider_id, p.provider_name, p.logo_path || null);
        insertAvail.run(id, media_type, p.provider_id, 'AU', avType, now, now);
        if (avType === 'flatrate') hasAuFlatrate = true;
      }
    }

    // Update display_status now that we have real streaming data
    const displayStatus = computeDisplayStatus({ tmdbStatus: null, releaseDate, hasAuStreaming: hasAuFlatrate });
    db.prepare(`UPDATE content SET display_status = ?, last_updated = ? WHERE id = ? AND media_type = ?`)
      .run(displayStatus, now, id, media_type);

  } catch (err) {
    console.error(`[detail] Lazy provider fetch failed for ${media_type}/${id}:`, err.message);
  }
}

async function fetchRecommendations(type, id, apiKey) {
  try {
    const data = await tmdbGet(`/${type}/${id}/recommendations?page=1`, apiKey);
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 12).map(r => ({ ...r, media_type: r.media_type || type }));
    }
  } catch {
    // fall through to similar
  }

  try {
    const data = await tmdbGet(`/${type}/${id}/similar?page=1`, apiKey);
    return (data.results || []).slice(0, 12).map(r => ({ ...r, media_type: type }));
  } catch {
    return [];
  }
}

/**
 * Find the best YouTube trailer key from a TMDB videos response.
 * Priority: official Trailer → any Trailer → Teaser.
 */
function findTrailerKey(videosData) {
  const videos = (videosData.results || []).filter(v => v.site === 'YouTube');
  return (
    videos.find(v => v.type === 'Trailer' && v.official)?.key ||
    videos.find(v => v.type === 'Trailer')?.key ||
    videos.find(v => v.type === 'Teaser')?.key ||
    null
  );
}

async function tmdbGet(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${apiKey}`);
  if (!res.ok) throw new Error(`TMDB ${path} returned HTTP ${res.status}`);
  return res.json();
}

module.exports = router;
