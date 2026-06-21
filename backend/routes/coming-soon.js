'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { buildLanguageFilterClause } = require('../utils/certOrder');

const router = Router();

// Hide coming_soon items with no release date that haven't been updated in 6 months
// (stale "in development" titles that will probably never release)
const STALE_MS = 6 * 30 * 24 * 60 * 60 * 1000;

const COLS = `id, media_type, title, overview, poster_path, release_date, vote_average,
  popularity, display_status, runtime, number_of_seasons, number_of_episodes, certification`;

/**
 * GET /api/coming-soon
 * Returns three groups in order:
 *   1. In cinemas now  — display_status='in_cinemas', sorted by release_date DESC
 *   2. Coming soon (known date) — sorted by release_date ASC (soonest first)
 *   3. Coming soon (no date) — sorted by popularity DESC, stale entries excluded
 * Query params:
 *   type             — 'movie' | 'tv'  (omit for all)
 *   excludeLanguages — comma-separated ISO 639-1 codes to exclude, e.g. 'hi,ko'
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, languageFilter } = req.query;

    // Build shared type + language params — each query uses its own params array
    // because the noDate query prepends staleCutoff before the type param.
    const buildParams = () => {
      const p = [];
      const langClause = buildLanguageFilterClause(languageFilter || null, p);
      const typeClause = (type === 'movie' || type === 'tv')
        ? (p.push(type), 'AND media_type = ?')
        : '';
      return { p, typeClause, langClause };
    };

    const staleCutoff = Date.now() - STALE_MS;

    const c1 = buildParams();
    const inCinemas = db.prepare(`
      SELECT ${COLS} FROM content
      WHERE display_status = 'in_cinemas' ${c1.langClause} ${c1.typeClause}
      ORDER BY release_date DESC
    `).all(...c1.p);

    const c2 = buildParams();
    const withDate = db.prepare(`
      SELECT ${COLS} FROM content
      WHERE display_status = 'coming_soon'
        AND release_date IS NOT NULL ${c2.langClause} ${c2.typeClause}
      ORDER BY release_date ASC
    `).all(...c2.p);

    const c3 = buildParams();
    const noDate = db.prepare(`
      SELECT ${COLS} FROM content
      WHERE display_status = 'coming_soon'
        AND release_date IS NULL
        AND last_updated >= ? ${c3.langClause} ${c3.typeClause}
      ORDER BY popularity DESC
    `).all(staleCutoff, ...c3.p);

    const rows = [...inCinemas, ...withDate, ...noDate];
    res.json({ results: attachStreamingAndGenres(db, rows) });
  } catch (err) {
    console.error('[GET /api/coming-soon]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load coming soon content' });
  }
});

module.exports = router;
