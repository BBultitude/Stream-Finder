'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');

const router = Router();

/**
 * GET /api/random
 * Returns a single random streaming title matching the active filters.
 * Query params: type, providers, decade (same as /api/browse)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, providers, decade } = req.query;

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
        ORDER BY RANDOM()
        LIMIT 1
      `).all(...providerIds, ...params);
    } else {
      rows = db.prepare(`
        SELECT id, media_type, title, overview, poster_path,
          release_date, vote_average, popularity, display_status,
          runtime, number_of_seasons, number_of_episodes, certification
        FROM content
        WHERE display_status = 'streaming'
        ${typeClause}
        ${decadeClause}
        ORDER BY RANDOM()
        LIMIT 1
      `).all(...params);
    }

    if (rows.length === 0) {
      return res.json({ result: null });
    }

    const enriched = attachStreamingAndGenres(db, rows);
    res.json({ result: enriched[0] });
  } catch (err) {
    console.error('[GET /api/random]', err.message);
    res.status(500).json({ result: null, error: 'Failed to load random content' });
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

function buildDecadeClause(decade, params) {
  const d = parseInt(decade, 10);
  if (!decade || isNaN(d) || d < 1900 || d > 2090) return '';
  params.push(d, d + 9);
  return 'AND CAST(SUBSTR(release_date, 1, 4) AS INTEGER) BETWEEN ? AND ?';
}

module.exports = router;
