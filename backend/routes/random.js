'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { buildCertClause, buildLanguageFilterClause } = require('../utils/certOrder');
const { parseProviderIds, buildTypeClause, buildDecadeClause, buildProviderClause, CONTENT_COLS } = require('../utils/routeHelpers');

const router = Router();

/**
 * GET /api/random
 * Returns a single random streaming title matching the active filters.
 * Query params: type, providers, decade, maxCertification, languageFilter
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, providers, decade, maxCertification, languageFilter } = req.query;

    const params = [];
    const providerClause = buildProviderClause(parseProviderIds(providers), params);
    const typeClause = buildTypeClause(type, params);
    const decadeClause = buildDecadeClause(decade, params);
    const certClause = buildCertClause(maxCertification, params);
    const langClause = buildLanguageFilterClause(languageFilter || null, params);

    const rows = db.prepare(`
      SELECT ${CONTENT_COLS}
      FROM content c
      WHERE c.display_status = 'streaming'
      ${providerClause}
      ${typeClause}
      ${decadeClause}
      ${certClause}
      ${langClause}
      ORDER BY RANDOM()
      LIMIT 1
    `).all(...params);

    if (rows.length === 0) {
      return res.json({ result: null });
    }

    res.json({ result: attachStreamingAndGenres(db, rows)[0] });
  } catch (err) {
    console.error('[GET /api/random]', err.message);
    res.status(500).json({ result: null, error: 'Failed to load random content' });
  }
});

module.exports = router;
