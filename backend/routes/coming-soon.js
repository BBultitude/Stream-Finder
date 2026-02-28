'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');

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
 *   type — 'movie' | 'tv'  (omit for all)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type } = req.query;

    const params = [];
    const typeClause = (type === 'movie' || type === 'tv')
      ? (params.push(type), 'AND media_type = ?')
      : '';

    const staleCutoff = Date.now() - STALE_MS;

    const inCinemas = db.prepare(`
      SELECT ${COLS} FROM content
      WHERE display_status = 'in_cinemas' ${typeClause}
      ORDER BY release_date DESC
    `).all(...params);

    const withDate = db.prepare(`
      SELECT ${COLS} FROM content
      WHERE display_status = 'coming_soon'
        AND release_date IS NOT NULL ${typeClause}
      ORDER BY release_date ASC
    `).all(...params);

    const noDate = db.prepare(`
      SELECT ${COLS} FROM content
      WHERE display_status = 'coming_soon'
        AND release_date IS NULL
        AND last_updated >= ? ${typeClause}
      ORDER BY popularity DESC
    `).all(staleCutoff, ...params);

    const rows = [...inCinemas, ...withDate, ...noDate];
    res.json({ results: attachStreamingAndGenres(db, rows) });
  } catch (err) {
    console.error('[GET /api/coming-soon]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load coming soon content' });
  }
});

module.exports = router;
