'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { attachStreamingAndGenres } = require('../utils/contentHelper');
const { buildCertClause, buildLanguageFilterClause } = require('../utils/certOrder');
const { parseProviderIds, buildTypeClause } = require('../utils/routeHelpers');

const router = Router();

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * GET /api/new
 * Returns content newly added to AU streaming platforms (first_seen within 30 days),
 * sorted by first_seen descending. Uses streaming_availability.first_seen so that
 * every result has the "New on Platform" badge in the UI.
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

    const cutoff = Date.now() - DAYS_30_MS;
    const providerIds = parseProviderIds(providers);
    const params = [];
    const typeClause = buildTypeClause(type, params);
    const certClause = buildCertClause(maxCertification, params);
    const langClause = buildLanguageFilterClause(languageFilter || null, params);

    let rows;
    if (providerIds.length > 0) {
      const ph = providerIds.map(() => '?').join(',');
      rows = db.prepare(`
        SELECT c.id, c.media_type, c.title, c.overview, c.poster_path,
          c.release_date, c.vote_average, c.popularity, c.display_status,
          c.runtime, c.number_of_seasons, c.number_of_episodes, c.certification
        FROM content c
        INNER JOIN streaming_availability sa
          ON sa.content_id = c.id
          AND sa.content_media_type = c.media_type
          AND sa.region = 'AU'
          AND sa.type = 'flatrate'
          AND sa.provider_id IN (${ph})
        WHERE c.display_status = 'streaming'
          AND sa.first_seen >= ?
          ${typeClause}
          ${certClause}
          ${langClause}
        GROUP BY c.id, c.media_type
        ORDER BY MAX(sa.first_seen) DESC
        LIMIT 100
      `).all(...providerIds, cutoff, ...params);
    } else {
      rows = db.prepare(`
        SELECT c.id, c.media_type, c.title, c.overview, c.poster_path,
          c.release_date, c.vote_average, c.popularity, c.display_status,
          c.runtime, c.number_of_seasons, c.number_of_episodes, c.certification
        FROM content c
        INNER JOIN streaming_availability sa
          ON sa.content_id = c.id
          AND sa.content_media_type = c.media_type
          AND sa.region = 'AU'
          AND sa.type = 'flatrate'
        WHERE c.display_status = 'streaming'
          AND sa.first_seen >= ?
          ${typeClause}
          ${certClause}
          ${langClause}
        GROUP BY c.id, c.media_type
        ORDER BY MAX(sa.first_seen) DESC
        LIMIT 100
      `).all(cutoff, ...params);
    }

    res.json({ results: attachStreamingAndGenres(db, rows) });
  } catch (err) {
    console.error('[GET /api/new]', err.message);
    res.status(500).json({ results: [], error: 'Failed to load new releases' });
  }
});

module.exports = router;
