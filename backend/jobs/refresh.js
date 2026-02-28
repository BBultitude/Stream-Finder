'use strict';

const cron = require('node-cron');
const { getDb } = require('../db');
const { computeDisplayStatus } = require('../utils/displayStatus');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const REGION = 'AU';

// Process 20 items per batch; ~700ms between batches stays under TMDB's 40 req/10s limit
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 700;

function getApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY environment variable is not set');
  return key;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Tracks when a 429 response allows us to resume — shared across concurrent batch items
let rateLimitedUntil = 0;

/**
 * Fetch from TMDB with automatic rate-limit handling.
 * On HTTP 429, reads the Retry-After header, waits the required duration,
 * and retries up to 3 times before throwing. All concurrent batch requests
 * check rateLimitedUntil before proceeding so they don't pile in during backoff.
 */
async function tmdbGet(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE}${path}${sep}api_key=${getApiKey()}`;
  const shortPath = path.split('?')[0];

  for (let attempt = 0; attempt <= 3; attempt++) {
    // Respect any active rate-limit window before firing the next request
    const now = Date.now();
    if (rateLimitedUntil > now) {
      await sleep(rateLimitedUntil - now);
    }

    const res = await fetch(url);

    if (res.ok) return res.json();

    if (res.status === 429) {
      const retryAfterSec = parseInt(res.headers.get('Retry-After') || '10', 10);
      const waitMs = (retryAfterSec + 2) * 1000; // +2s buffer
      rateLimitedUntil = Date.now() + waitMs;
      console.warn(`[refresh] TMDB 429 on ${shortPath} — backing off ${retryAfterSec + 2}s (attempt ${attempt + 1}/4)`);
      if (attempt < 3) {
        await sleep(waitMs);
        continue;
      }
    }

    throw new Error(`TMDB ${shortPath} returned HTTP ${res.status}`);
  }
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

function upsertContent(db, item, now) {
  const title = item.title || item.name || 'Unknown';
  const releaseDate = item.release_date || item.first_air_date || null;

  db.prepare(`
    INSERT INTO content
      (id, media_type, title, overview, poster_path, release_date,
       vote_average, popularity, display_status, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id, media_type) DO UPDATE SET
      title          = excluded.title,
      overview       = excluded.overview,
      poster_path    = excluded.poster_path,
      release_date   = excluded.release_date,
      vote_average   = excluded.vote_average,
      popularity     = excluded.popularity,
      last_updated   = excluded.last_updated
  `).run(
    item.id,
    item.media_type,
    title,
    item.overview || '',
    item.poster_path || null,
    releaseDate,
    item.vote_average || 0,
    item.popularity || 0,
    'coming_soon',  // placeholder; updated after streaming check
    now
  );
}

function upsertGenres(db, item) {
  if (!item.genre_ids || item.genre_ids.length === 0) return;
  const insertCG = db.prepare(`
    INSERT OR IGNORE INTO content_genres (content_id, content_media_type, genre_id)
    VALUES (?, ?, ?)
  `);
  for (const genreId of item.genre_ids) {
    insertCG.run(item.id, item.media_type, genreId);
  }
}

/**
 * Fetch full detail for one content item from TMDB using append_to_response,
 * combining watch/providers + release_dates (movie) or content_ratings (TV)
 * into a single API call. Stores runtime, seasons, episodes, AU certification,
 * and streaming availability.
 *
 * Returns true if at least one flatrate AU provider was found.
 *
 * Critical: `first_seen` is set only on INSERT — never updated. This preserves
 * the first-seen timestamp required for IMP-06 (New on Platform badges).
 */
async function fetchAndStoreDetail(db, contentId, mediaType, now) {
  try {
    const appendKeys = mediaType === 'movie'
      ? 'watch%2Fproviders,release_dates'
      : 'watch%2Fproviders,content_ratings';
    const data = await tmdbGet(`/${mediaType}/${contentId}?append_to_response=${appendKeys}`);

    // AU streaming providers (previously from /watch/providers?region=AU)
    const auData = data['watch/providers']?.results?.[REGION] || {};

    // Runtime (movies) / seasons + episodes (TV)
    const runtime         = mediaType === 'movie' ? (data.runtime || null) : null;
    const numberOfSeasons = mediaType === 'tv'    ? (data.number_of_seasons || null) : null;
    const numberOfEpisodes = mediaType === 'tv'   ? (data.number_of_episodes || null) : null;

    // AU age certification
    let certification = null;
    if (mediaType === 'movie') {
      const auEntry = (data.release_dates?.results || []).find(r => r.iso_3166_1 === 'AU');
      if (auEntry) {
        certification = auEntry.release_dates.find(rd => rd.certification)?.certification || null;
      }
    } else {
      const auEntry = (data.content_ratings?.results || []).find(r => r.iso_3166_1 === 'AU');
      certification = auEntry?.rating || null;
    }

    db.prepare(`
      UPDATE content
      SET runtime = ?, number_of_seasons = ?, number_of_episodes = ?, certification = ?
      WHERE id = ? AND media_type = ?
    `).run(runtime, numberOfSeasons, numberOfEpisodes, certification, contentId, mediaType);

    const upsertProvider = db.prepare(`
      INSERT INTO providers (provider_id, provider_name, logo_path)
      VALUES (?, ?, ?)
      ON CONFLICT(provider_id) DO UPDATE SET
        provider_name = excluded.provider_name,
        logo_path     = excluded.logo_path
    `);

    // ON CONFLICT: update last_confirmed only; preserve first_seen
    const insertAvail = db.prepare(`
      INSERT INTO streaming_availability
        (content_id, content_media_type, provider_id, region, type, first_seen, last_confirmed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id, content_media_type, provider_id, region, type)
      DO UPDATE SET last_confirmed = excluded.last_confirmed
    `);

    let hasAuFlatrate = false;
    for (const type of ['flatrate', 'rent', 'buy']) {
      for (const p of auData[type] || []) {
        upsertProvider.run(p.provider_id, p.provider_name, p.logo_path || null);
        insertAvail.run(contentId, mediaType, p.provider_id, REGION, type, now, now);
        if (type === 'flatrate') hasAuFlatrate = true;
      }
    }
    return hasAuFlatrate;
  } catch (err) {
    console.error(`[refresh] Detail fetch failed for ${mediaType}/${contentId}: ${err.message}`);
    return false;
  }
}

function setDisplayStatus(db, contentId, mediaType, hasAuStreaming, releaseDate) {
  const status = computeDisplayStatus({ tmdbStatus: null, releaseDate, hasAuStreaming });
  db.prepare(`
    UPDATE content SET display_status = ? WHERE id = ? AND media_type = ?
  `).run(status, contentId, mediaType);
  return status;
}

function logRefresh(db, jobName, status, recordsUpdated) {
  db.prepare(`
    INSERT INTO refresh_log (job_name, last_run, status, records_updated)
    VALUES (?, ?, ?, ?)
  `).run(jobName, Date.now(), status, recordsUpdated);
}

// ─── Content refresh pipeline ─────────────────────────────────────────────────

/**
 * Upsert a list of TMDB content items into the DB, then fetch and store
 * streaming availability for each. Processes in batches to respect rate limits.
 */
async function refreshContentList(db, items) {
  const now = Date.now();
  let count = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async item => {
      if (!item.media_type || !['movie', 'tv'].includes(item.media_type)) return;
      upsertContent(db, item, now);
      upsertGenres(db, item);
      const hasStreaming = await fetchAndStoreDetail(db, item.id, item.media_type, now);
      setDisplayStatus(db, item.id, item.media_type, hasStreaming, item.release_date || item.first_air_date);
      count++;
    }));

    if (i + BATCH_SIZE < items.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return count;
}

// ─── Scheduled jobs ───────────────────────────────────────────────────────────

async function refreshTrending() {
  const db = getDb();
  const t0 = Date.now();
  console.log('[refresh] trending: starting');
  try {
    const items = [];
    for (let page = 1; page <= 5; page++) {
      const data = await tmdbGet(`/trending/all/week?page=${page}`);
      if (data.results) items.push(...data.results);
    }
    const filtered = items.filter(i => i.media_type === 'movie' || i.media_type === 'tv');
    const count = await refreshContentList(db, filtered);
    logRefresh(db, 'trending', 'success', count);
    console.log(`[refresh] trending: done — ${count} items in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error('[refresh] trending: failed —', err.message);
    logRefresh(db, 'trending', `error: ${err.message}`, 0);
  }
}

async function refreshNewReleases() {
  const db = getDb();
  const t0 = Date.now();
  console.log('[refresh] new_releases: starting');
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    const dateStr = cutoff.toISOString().split('T')[0];

    const items = [];
    for (let page = 1; page <= 5; page++) {
      const [movies, tv] = await Promise.all([
        tmdbGet(`/discover/movie?sort_by=release_date.desc&release_date.gte=${dateStr}&vote_count.gte=10&page=${page}`),
        tmdbGet(`/discover/tv?sort_by=first_air_date.desc&first_air_date.gte=${dateStr}&vote_count.gte=10&page=${page}`)
      ]);
      if (movies.results) items.push(...movies.results.map(m => ({ ...m, media_type: 'movie' })));
      if (tv.results)     items.push(...tv.results.map(t => ({ ...t, media_type: 'tv' })));
    }

    const count = await refreshContentList(db, items);
    logRefresh(db, 'new_releases', 'success', count);
    console.log(`[refresh] new_releases: done — ${count} items in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error('[refresh] new_releases: failed —', err.message);
    logRefresh(db, 'new_releases', `error: ${err.message}`, 0);
  }
}

async function refreshStreamingAvailability() {
  const db = getDb();
  const t0 = Date.now();
  console.log('[refresh] streaming_availability: starting');
  try {
    const now = Date.now();
    // Process oldest items first — if the job is interrupted mid-run, the next
    // run will naturally resume from the most stale items
    const allContent = db.prepare(
      'SELECT id, media_type, release_date FROM content ORDER BY last_updated ASC'
    ).all();
    let count = 0;

    for (let i = 0; i < allContent.length; i += BATCH_SIZE) {
      const batch = allContent.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async item => {
        const hasStreaming = await fetchAndStoreDetail(db, item.id, item.media_type, now);
        setDisplayStatus(db, item.id, item.media_type, hasStreaming, item.release_date);
        count++;
      }));
      if (i + BATCH_SIZE < allContent.length) await sleep(BATCH_DELAY_MS);
    }

    logRefresh(db, 'streaming_availability', 'success', count);
    console.log(`[refresh] streaming_availability: done — ${count} items in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error('[refresh] streaming_availability: failed —', err.message);
    logRefresh(db, 'streaming_availability', `error: ${err.message}`, 0);
  }
}

// ─── Startup and scheduling ───────────────────────────────────────────────────

/**
 * If the database is empty, run trending + new releases immediately so the
 * frontend has data on first visit.
 */
async function runInitialRefreshIfNeeded() {
  const db = getDb();
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM content').get();
  if (count === 0) {
    console.log('[refresh] Empty database — running initial populate (async)...');
    refreshTrending()
      .then(() => refreshNewReleases())
      .then(() => refreshStreamingAvailability())
      .catch(err => console.error('[refresh] Initial populate failed:', err.message));
  } else {
    console.log(`[refresh] Database has ${count} items — skipping initial populate`);
  }
}

function startCronJobs() {
  // Trending: every 6 hours
  cron.schedule('0 */6 * * *', () => {
    refreshTrending().catch(err => console.error('[cron] trending:', err.message));
  });

  // New releases: every 12 hours
  cron.schedule('0 */12 * * *', () => {
    refreshNewReleases().catch(err => console.error('[cron] new_releases:', err.message));
  });

  // Streaming availability: every day at 03:00
  cron.schedule('0 3 * * *', () => {
    refreshStreamingAvailability().catch(err => console.error('[cron] streaming_availability:', err.message));
  });

  console.log('[refresh] Cron jobs scheduled (trending 6h, new_releases 12h, streaming 03:00 daily)');
}

module.exports = { runInitialRefreshIfNeeded, startCronJobs };
