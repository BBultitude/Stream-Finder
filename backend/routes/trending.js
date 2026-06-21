'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { buildCertClause, buildLanguageFilterClause } = require('../utils/certOrder');
const { parseProviderIds, buildTypeClause } = require('../utils/routeHelpers');

const router = Router();

/**
 * GET /api/trending
 * Query params:
 *   type             — 'movie' | 'tv'  (omit for all)
 *   providers        — comma-separated TMDB provider IDs to filter by
 *   maxCertification — AU classification ceiling, e.g. 'PG' returns E, G, PG
 *   excludeLanguages — comma-separated ISO 639-1 codes to exclude, e.g. 'hi,ko'
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, providers, maxCertification, languageFilter } = req.query;

    const providerIds = parseProviderIds(providers);
    const params = [];
    const typeClause = buildTypeClause(type, params);
    const certClause = buildCertClause(maxCertification, params);
    const langClause = buildLanguageFilterClause(languageFilter || null, params);

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
        ${certClause}
        ${langClause}
        ORDER BY c.popularity DESC
        LIMIT 100
      `).all(...providerIds, ...params);
    } else {
      rows = db.prepare(`
        SELECT id, media_type, title, overview, poster_path,
          release_date, vote_average, popularity, display_status,
          runtime, number_of_seasons, number_of_episodes, certification
        FROM content
        WHERE display_status = 'streaming'
        ${typeClause}
        ${certClause}
        ${langClause}
        ORDER BY popularity DESC
        LIMIT 100
      `).all(...params);
    }

    res.json({ results: attachStreamingAndGenres(db, rows) });
  } catch (err) {
    console.error('[GET /api/trending]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load trending content' });
  }
});

module.exports = router;
