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
      const retryAfterSec = Number.parseInt(res.headers.get('Retry-After') || '10', 10);
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

  // INSERT OR IGNORE: writes all fields on first insert; no-op on conflict
  // (static identity fields — title, overview, poster, release_date — are never overwritten)
  db.prepare(`
    INSERT OR IGNORE INTO content
      (id, media_type, title, overview, poster_path, release_date,
       vote_average, popularity, display_status, last_updated, original_language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'coming_soon', ?, ?)
  `).run(
    item.id,
    item.media_type,
    title,
    item.overview || '',
    item.poster_path || null,
    releaseDate,
    item.vote_average || 0,
    item.popularity || 0,
    now,
    item.original_language || null
  );

  // Update mutable fields; populate original_language if not yet set
  db.prepare(`
    UPDATE content SET popularity = ?, vote_average = ?, last_updated = ?,
      original_language = COALESCE(original_language, ?)
    WHERE id = ? AND media_type = ?
  `).run(item.popularity || 0, item.vote_average || 0, now, item.original_language || null, item.id, item.media_type);
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
      SET runtime            = COALESCE(runtime, ?),
          number_of_seasons  = ?,
          number_of_episodes = ?,
          certification      = ?,
          last_updated       = ?
      WHERE id = ? AND media_type = ?
    `).run(runtime, numberOfSeasons, numberOfEpisodes, certification, now, contentId, mediaType);

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
  const status = computeDisplayStatus({ tmdbStatus: null, releaseDate, hasAuStreaming, mediaType });
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

async function refreshDecade(db, decadeStart, now, sevenDaysMs) {
  const decadeEnd = decadeStart + 9;
  const startDate = `${decadeStart}-01-01`;
  const endDate   = `${decadeEnd}-12-31`;

  const rawItems = [];
  for (let page = 1; page <= 5; page++) {
    const [movies, tv] = await Promise.all([
      tmdbGet(`/discover/movie?sort_by=vote_count.desc&vote_count.gte=100&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&page=${page}`),
      tmdbGet(`/discover/tv?sort_by=vote_count.desc&vote_count.gte=100&first_air_date.gte=${startDate}&first_air_date.lte=${endDate}&page=${page}`)
    ]);
    if (movies.results) rawItems.push(...movies.results.map(m => ({ ...m, media_type: 'movie' })));
    if (tv.results)     rawItems.push(...tv.results.map(t => ({ ...t, media_type: 'tv' })));
  }

  const validItems = rawItems.filter(i => ['movie', 'tv'].includes(i.media_type));
  if (validItems.length === 0) return 0;

  const movieIds = validItems.filter(i => i.media_type === 'movie').map(i => i.id);
  const tvIds    = validItems.filter(i => i.media_type === 'tv').map(i => i.id);
  const freshSet = new Set();
  const cutoff   = now - sevenDaysMs;

  if (movieIds.length) {
    const ph = movieIds.map(() => '?').join(',');
    db.prepare(
      `SELECT id FROM content WHERE media_type = 'movie' AND id IN (${ph}) AND last_updated > ?`
    ).all(...movieIds, cutoff).forEach(r => freshSet.add(`movie:${r.id}`));
  }
  if (tvIds.length) {
    const ph = tvIds.map(() => '?').join(',');
    db.prepare(
      `SELECT id FROM content WHERE media_type = 'tv' AND id IN (${ph}) AND last_updated > ?`
    ).all(...tvIds, cutoff).forEach(r => freshSet.add(`tv:${r.id}`));
  }

  const needsDetail = [];
  for (const item of validItems) {
    upsertContent(db, item, now);
    upsertGenres(db, item);
    if (!freshSet.has(`${item.media_type}:${item.id}`)) {
      needsDetail.push(item);
    }
  }

  for (let i = 0; i < needsDetail.length; i += BATCH_SIZE) {
    const batch = needsDetail.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async item => {
      const hasStreaming = await fetchAndStoreDetail(db, item.id, item.media_type, now);
      setDisplayStatus(db, item.id, item.media_type, hasStreaming, item.release_date || item.first_air_date);
    }));
    if (i + BATCH_SIZE < needsDetail.length) await sleep(BATCH_DELAY_MS);
  }

  console.log(`[refresh] decade_catalogue: ${decadeStart}s — ${validItems.length} items (${needsDetail.length} detail fetches)`);
  return validItems.length;
}

/**
 * Populate the catalogue with well-known content from each decade (1970s–2020s).
 * Queries TMDB /discover sorted by vote_count descending, 5 pages per decade per
 * media type. Skips fetchAndStoreDetail for items already refreshed within 7 days
 * (handled by trending/new_releases/streaming sweep); fetches full detail for new
 * or stale items only.
 */
async function refreshByDecade() {
  const db = getDb();
  const t0 = Date.now();
  console.log('[refresh] decade_catalogue: starting');
  try {
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const DECADES = [1970, 1980, 1990, 2000, 2010, 2020];
    let totalCount = 0;

    for (const decadeStart of DECADES) {
      totalCount += await refreshDecade(db, decadeStart, now, SEVEN_DAYS_MS);
    }

    logRefresh(db, 'decade_catalogue', 'success', totalCount);
    console.log(`[refresh] decade_catalogue: done — ${totalCount} items in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error('[refresh] decade_catalogue: failed —', err.message);
    logRefresh(db, 'decade_catalogue', `error: ${err.message}`, 0);
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
    // Each job runs independently so a failure in one doesn't skip the rest
    ;(async () => {
      await refreshTrending().catch(err => console.error('[refresh] Initial trending failed:', err.message));
      await refreshNewReleases().catch(err => console.error('[refresh] Initial new_releases failed:', err.message));
      await refreshStreamingAvailability().catch(err => console.error('[refresh] Initial streaming failed:', err.message));
    })();
  } else {
    console.log(`[refresh] Database has ${count} items — skipping initial populate`);
  }
}

function startCronJobs() {
  // Per-job lock flags — prevent overlapping executions if a job runs longer than its interval
  let trendingRunning = false;
  let newReleasesRunning = false;
  let streamingRunning = false;
  let decadeRunning = false;

  // Trending: every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    if (trendingRunning) { console.warn('[cron] trending: skipped — already running'); return; }
    trendingRunning = true;
    try { await refreshTrending(); } catch (err) { console.error('[cron] trending:', err.message); } finally { trendingRunning = false; }
  });

  // New releases: every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    if (newReleasesRunning) { console.warn('[cron] new_releases: skipped — already running'); return; }
    newReleasesRunning = true;
    try { await refreshNewReleases(); } catch (err) { console.error('[cron] new_releases:', err.message); } finally { newReleasesRunning = false; }
  });

  // Streaming availability: every day at 03:00
  cron.schedule('0 3 * * *', async () => {
    if (streamingRunning) { console.warn('[cron] streaming_availability: skipped — already running'); return; }
    streamingRunning = true;
    try { await refreshStreamingAvailability(); } catch (err) { console.error('[cron] streaming_availability:', err.message); } finally { streamingRunning = false; }
  });

  // Decade catalogue: every Sunday at 04:00 (after 03:00 streaming sweep)
  cron.schedule('0 4 * * 0', async () => {
    if (decadeRunning) { console.warn('[cron] decade_catalogue: skipped — already running'); return; }
    decadeRunning = true;
    try { await refreshByDecade(); } catch (err) { console.error('[cron] decade_catalogue:', err.message); } finally { decadeRunning = false; }
  });

  console.log('[refresh] Cron jobs scheduled (trending 6h, new_releases 12h, streaming 03:00 daily, decade_catalogue Sun 04:00)');
}

module.exports = { runInitialRefreshIfNeeded, startCronJobs };
