'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { buildCertClause, buildLanguageFilterClause } = require('../utils/certOrder');
const { parseProviderIds, buildTypeClause, buildDecadeClause, buildProviderClause, CONTENT_COLS } = require('../utils/routeHelpers');

const router = Router();

const PAGE_SIZE = 40;

/**
 * GET /api/browse
 * Paginated browse of streaming content sorted by popularity.
 * Query params:
 *   page             — integer page number (default 1)
 *   type             — 'movie' | 'tv'  (omit for all)
 *   providers        — comma-separated TMDB provider IDs to filter by
 *   decade           — start year of decade, e.g. 1990 filters 1990–1999
 *   sortBy           — 'popularity' | 'vote_average' | 'release_date' (default popularity)
 *   maxCertification — AU classification ceiling, e.g. 'PG' returns E, G, PG
 *   languageFilter   — ISO 639-1 code to include, e.g. 'en', 'ko', 'ja'
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, providers, decade, sortBy, maxCertification, languageFilter } = req.query;

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const params = [];
    const providerClause = buildProviderClause(parseProviderIds(providers), params);
    const typeClause = buildTypeClause(type, params);
    const decadeClause = buildDecadeClause(decade, params);
    const certClause = buildCertClause(maxCertification, params);
    const langClause = buildLanguageFilterClause(languageFilter || null, params);
    const orderClause = buildOrderClause(sortBy);

    const rows = db.prepare(`
      SELECT ${CONTENT_COLS}
      FROM content c
      WHERE c.display_status = 'streaming'
      ${providerClause}
      ${typeClause}
      ${decadeClause}
      ${certClause}
      ${langClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).all(...params, PAGE_SIZE, offset);

    res.json({ results: attachStreamingAndGenres(db, rows), page });
  } catch (err) {
    console.error('[GET /api/browse]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load browse content' });
  }
});

function buildOrderClause(sortBy) {
  // c.media_type, c.id break ties so Load More pages never repeat or skip rows
  if (sortBy === 'vote_average') return 'ORDER BY c.vote_average DESC, c.media_type, c.id';
  if (sortBy === 'release_date') return 'ORDER BY c.release_date DESC, c.media_type, c.id';
  return 'ORDER BY c.popularity DESC, c.media_type, c.id';
}

module.exports = router;
