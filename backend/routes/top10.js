'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');

const router = Router();

/**
 * GET /api/top10
 * Returns the top 10 titles by TMDB popularity that have confirmed AU
 * streaming availability. Derived entirely from existing DB data — no
 * additional TMDB API calls required.
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

    const rows = db.prepare(`
      SELECT id, media_type, title, overview, poster_path,
        release_date, vote_average, popularity, display_status,
        runtime, number_of_seasons, number_of_episodes, certification
      FROM content
      WHERE display_status = 'streaming'
      ${typeClause}
      ORDER BY popularity DESC
      LIMIT 10
    `).all(...params);

    res.json({ results: attachStreamingAndGenres(db, rows) });
  } catch (err) {
    console.error('[GET /api/top10]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load Top 10' });
  }
});

module.exports = router;
