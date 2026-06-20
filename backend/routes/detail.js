'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres, buildStreamingMap } = require('../utils/contentHelper');

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

    const db = getDb();

    // Synchronous DB lookups for source item (needed for local recommendations + watchlist refresh)
    const srcGenreIds = db.prepare(
      'SELECT genre_id FROM content_genres WHERE content_id = ? AND content_media_type = ?'
    ).all(contentId, type).map(r => r.genre_id);

    const contentRow = db.prepare(
      'SELECT display_status FROM content WHERE id = ? AND media_type = ?'
    ).get(contentId, type);

    const streamingMap = buildStreamingMap(db, [{ id: contentId, media_type: type }]);
    const streaming = streamingMap[`${contentId}_${type}`] || [];

    // Fetch external_ids, recommendations, videos, and credits in parallel.
    // All calls have individual fallbacks so a single TMDB failure doesn't 404 the whole detail.
    const [externalIds, recsData, videosData, creditsData] = await Promise.all([
      tmdbGet(`/${type}/${contentId}/external_ids`, apiKey).catch(() => ({})),
      fetchRecommendations(type, contentId, apiKey),
      tmdbGet(`/${type}/${contentId}/videos`, apiKey).catch(() => ({ results: [] })),
      tmdbGet(`/${type}/${contentId}/credits`, apiKey).catch(() => ({ cast: [] }))
    ]);

    // Hybrid recommendations: TMDB recs (streaming-only from DB) + local genre-similarity,
    // merged and deduplicated up to 20. No lazy TMDB provider fetches.
    const recommendations = enrichRecommendations(db, recsData, type, contentId, srcGenreIds);

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
      cast,
      streaming,
      display_status: contentRow?.display_status || null
    };

    detailCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    console.error(`[GET /api/detail/${type}/${contentId}]`, err.message);
    res.status(500).json({ imdb_id: null, recommendations: [], error: 'Failed to load detail' });
  }
});

/**
 * Build hybrid recommendations:
 * 1. TMDB recs filtered to items already in our DB with display_status = 'streaming'
 * 2. Local DB similarity recs by genre overlap (fills remaining slots to 20)
 * Merged and deduplicated — all results guaranteed to have AU streaming data.
 * No lazy TMDB provider fetches.
 */
function enrichRecommendations(db, recsData, fallbackType, sourceId, sourceGenreIds) {
  const tmdbItems = recsData.map(r => ({ ...r, media_type: r.media_type || fallbackType }));

  // Filter TMDB recs to items in our DB with streaming status only
  const movieIds = tmdbItems.filter(i => i.media_type === 'movie').map(i => i.id);
  const tvIds    = tmdbItems.filter(i => i.media_type === 'tv').map(i => i.id);
  const tmdbDbRows = [];

  if (movieIds.length) {
    const ph = movieIds.map(() => '?').join(',');
    tmdbDbRows.push(...db.prepare(`
      SELECT id, media_type, title, overview, poster_path, release_date, vote_average,
        popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification
      FROM content WHERE media_type = 'movie' AND id IN (${ph}) AND display_status = 'streaming'
    `).all(...movieIds));
  }
  if (tvIds.length) {
    const ph = tvIds.map(() => '?').join(',');
    tmdbDbRows.push(...db.prepare(`
      SELECT id, media_type, title, overview, poster_path, release_date, vote_average,
        popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification
      FROM content WHERE media_type = 'tv' AND id IN (${ph}) AND display_status = 'streaming'
    `).all(...tvIds));
  }

  // Local DB similarity recs by genre overlap (pure SQL, no API calls)
  const localRows = buildLocalRecommendations(db, sourceId, fallbackType, sourceGenreIds);

  // Merge: TMDB recs first, local fills to 20, deduplicated by id+media_type
  const seen = new Set();
  const merged = [];
  for (const row of [...tmdbDbRows, ...localRows]) {
    const key = `${row.media_type}:${row.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(row);
      if (merged.length >= 20) break;
    }
  }

  if (merged.length === 0) return [];
  return attachStreamingAndGenres(db, merged);
}

/**
 * Find similar content by genre overlap using a pure DB query.
 * Primary signal: shared genre count. Tiebreaker: popularity.
 * Results guaranteed to have display_status = 'streaming'.
 */
function buildLocalRecommendations(db, contentId, mediaType, genreIds) {
  if (!genreIds || genreIds.length === 0) return [];
  const ph = genreIds.map(() => '?').join(',');
  return db.prepare(`
    SELECT c.id, c.media_type, c.title, c.overview, c.poster_path, c.release_date,
      c.vote_average, c.popularity, c.display_status, c.runtime,
      c.number_of_seasons, c.number_of_episodes, c.certification,
      COUNT(DISTINCT cg2.genre_id) AS shared_genres
    FROM content c
    JOIN content_genres cg2
      ON c.id = cg2.content_id AND c.media_type = cg2.content_media_type
    WHERE cg2.genre_id IN (${ph})
      AND NOT (c.id = ? AND c.media_type = ?)
      AND c.display_status = 'streaming'
    GROUP BY c.id, c.media_type
    ORDER BY shared_genres DESC, c.popularity DESC
    LIMIT 20
  `).all(...genreIds, contentId, mediaType);
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
