'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { buildCertClause, buildLanguageFilterClause } = require('../utils/certOrder');
const { parseProviderIds, buildTypeClause, buildProviderClause, CONTENT_COLS } = require('../utils/routeHelpers');

const router = Router();

/**
 * GET /api/trending
 * Query params:
 *   type             — 'movie' | 'tv'  (omit for all)
 *   providers        — comma-separated TMDB provider IDs to filter by
 *   maxCertification — AU classification ceiling, e.g. 'PG' returns E, G, PG
 *   languageFilter   — ISO 639-1 code to include, e.g. 'en', 'ko', 'ja'
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, providers, maxCertification, languageFilter } = req.query;

    // Clauses push their params in the same order they appear in the SQL
    const params = [];
    const providerClause = buildProviderClause(parseProviderIds(providers), params);
    const typeClause = buildTypeClause(type, params);
    const certClause = buildCertClause(maxCertification, params);
    const langClause = buildLanguageFilterClause(languageFilter || null, params);

    const rows = db.prepare(`
      SELECT ${CONTENT_COLS}
      FROM content c
      WHERE c.display_status = 'streaming'
      ${providerClause}
      ${typeClause}
      ${certClause}
      ${langClause}
      ORDER BY c.popularity DESC
      LIMIT 100
    `).all(...params);

    res.json({ results: attachStreamingAndGenres(db, rows) });
  } catch (err) {
    console.error('[GET /api/trending]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load trending content' });
  }
});

module.exports = router;
