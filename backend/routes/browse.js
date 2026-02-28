'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');

const router = Router();

const PAGE_SIZE = 40;

/**
 * GET /api/browse
 * Paginated browse of streaming content sorted by popularity.
 * Query params:
 *   page      — integer page number (default 1)
 *   type      — 'movie' | 'tv'  (omit for all)
 *   providers — comma-separated TMDB provider IDs to filter by
 *   decade    — start year of decade, e.g. 1990 filters 1990–1999
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, providers, decade } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const providerIds = parseProviderIds(providers);
    const params = [];
    const typeClause = buildTypeClause(type, params);
    const decadeClause = buildDecadeClause(decade, params);

    let rows;
    if (providerIds.length > 0) {
      const ph = providerIds.map(() => '?').join(',');
      rows = db.prepare(`
        SELECT DISTINCT c.id, c.media_type, c.title, c.overview, c.poster_path,
          c.release_date, c.vote_average, c.popularity, c.display_status,
          c.runtime, c.number_of_seasons, c.number_of_episodes, c.certification
        FROM content c
        INNER JOIN streaming_availability sa
          ON sa.content_id = c.id
          AND sa.content_media_type = c.media_type
          AND sa.region = 'AU'
          AND sa.provider_id IN (${ph})
        WHERE c.display_status = 'streaming'
        ${typeClause}
        ${decadeClause}
        ORDER BY c.popularity DESC
        LIMIT ? OFFSET ?
      `).all(...providerIds, ...params, PAGE_SIZE, offset);
    } else {
      rows = db.prepare(`
        SELECT id, media_type, title, overview, poster_path,
          release_date, vote_average, popularity, display_status,
          runtime, number_of_seasons, number_of_episodes, certification
        FROM content
        WHERE display_status = 'streaming'
        ${typeClause}
        ${decadeClause}
        ORDER BY popularity DESC
        LIMIT ? OFFSET ?
      `).all(...params, PAGE_SIZE, offset);
    }

    res.json({ results: attachStreamingAndGenres(db, rows), page });
  } catch (err) {
    console.error('[GET /api/browse]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load browse content' });
  }
});

function parseProviderIds(str) {
  if (!str) return [];
  return str.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0);
}

function buildTypeClause(type, params) {
  if (type === 'movie' || type === 'tv') {
    params.push(type);
    return 'AND media_type = ?';
  }
  return '';
}

/**
 * Builds a WHERE fragment filtering release_date to a decade range.
 * Uses SUBSTR to extract the 4-digit year from the YYYY-MM-DD text column.
 */
function buildDecadeClause(decade, params) {
  const d = parseInt(decade, 10);
  if (!decade || isNaN(d) || d < 1900 || d > 2090) return '';
  params.push(d, d + 9);
  return 'AND CAST(SUBSTR(release_date, 1, 4) AS INTEGER) BETWEEN ? AND ?';
}

module.exports = router;
