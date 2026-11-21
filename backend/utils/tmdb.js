'use strict';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const REQUEST_TIMEOUT_MS = 15000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Tracks when a 429 response allows us to resume — shared by every caller in the process
let rateLimitedUntil = 0;

/**
 * Fetch from TMDB with a request timeout and shared rate-limit handling.
 * On HTTP 429, reads Retry-After, waits, and retries up to maxAttempts total.
 * Every caller checks rateLimitedUntil first so none pile in during a backoff.
 * User-facing routes pass maxAttempts: 1 so a request never waits through retries.
 */
async function tmdbGet(path, { maxAttempts = 4 } = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB_API_KEY environment variable is not set');

  const sep = path.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE}${path}${sep}api_key=${apiKey}`;
  const shortPath = path.split('?')[0];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const wait = rateLimitedUntil - Date.now();
    if (wait > 0) {
      // A visitor's request must fail fast rather than sit through the background job's backoff
      if (maxAttempts === 1) throw new Error(`TMDB ${shortPath} rate limited`);
      await sleep(wait);
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (res.ok) return res.json();

    if (res.status === 429) {
      const retryAfterSec = Number.parseInt(res.headers.get('Retry-After'), 10) || 10; // header may be an HTTP date -> NaN
      rateLimitedUntil = Date.now() + (retryAfterSec + 2) * 1000; // +2s buffer
      console.warn(`[tmdb] 429 on ${shortPath} — backing off ${retryAfterSec + 2}s (attempt ${attempt}/${maxAttempts})`);
      if (attempt < maxAttempts) continue;
    }

    throw new Error(`TMDB ${shortPath} returned HTTP ${res.status}`);
  }
}

module.exports = { tmdbGet };
