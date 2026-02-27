'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { shapeItem, buildStreamingMap } = require('../utils/contentHelper');
const { computeDisplayStatus } = require('../utils/displayStatus');

const router = Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * GET /api/search
 * Proxies TMDB search/multi from the backend — API key never leaves the server.
 * Enriches results with AU streaming data from the DB where available.
 * Query params:
 *   query     — search string (required)
 *   providers — comma-separated TMDB provider IDs to filter results by (optional)
 */
router.get('/', async (req, res) => {
  const { query, providers } = req.query;

  if (!query || !query.trim()) {
    return res.json({ results: [] });
  }

  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY not configured');

    const url = `${TMDB_BASE}/search/multi?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query.trim())}&page=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDB search returned HTTP ${response.status}`);
    const data = await response.json();

    let items = (data.results || [])
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 20);

    if (items.length === 0) {
      return res.json({ results: [] });
    }

    // Enrich with AU streaming and display_status from DB where available
    const db = getDb();
    const streamingMap = buildStreamingMap(db, items);
    const dbStatusMap = buildDbStatusMap(db, items);

    const providerIds = parseProviderIds(providers);

    let results = items.map(item => {
      const key = `${item.id}_${item.media_type}`;
      const streaming = streamingMap[key] || [];
      const shaped = shapeItem(item, streaming, item.genre_ids || []);
      // Use DB display_status if item is known; otherwise compute from available data
      shaped.display_status = dbStatusMap[key] || computeDisplayStatus({
        tmdbStatus: null,
        releaseDate: item.release_date || item.first_air_date,
        hasAuStreaming: streaming.length > 0
      });
      return shaped;
    });

    // Apply provider filter client-side if requested
    if (providerIds.length > 0) {
      const allowedNames = getAllowedProviderNames(db, providerIds);
      results = results.filter(item =>
        item.streaming.some(s => allowedNames.has(s.name))
      );
    }

    res.json({ results });
  } catch (err) {
    console.error('[GET /api/search]', err.message);
    res.status(500).json({ results: [], error: 'Search failed' });
  }
});

function parseProviderIds(str) {
  if (!str) return [];
  return str.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0);
}

/**
 * Fetch display_status from the content table for items that are in the DB.
 * Returns a map keyed by `${id}_${media_type}`.
 */
function buildDbStatusMap(db, items) {
  const map = {};
  const movieIds = items.filter(i => i.media_type === 'movie').map(i => i.id);
  const tvIds    = items.filter(i => i.media_type === 'tv').map(i => i.id);

  for (const [mediaType, ids] of [['movie', movieIds], ['tv', tvIds]]) {
    if (ids.length === 0) continue;
    const ph = ids.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT id, display_status FROM content
      WHERE media_type = ? AND id IN (${ph})
    `).all(mediaType, ...ids);
    for (const row of rows) {
      map[`${row.id}_${mediaType}`] = row.display_status;
    }
  }
  return map;
}

function getAllowedProviderNames(db, providerIds) {
  if (providerIds.length === 0) return new Set();
  const ph = providerIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT provider_name FROM providers WHERE provider_id IN (${ph})
  `).all(...providerIds);
  return new Set(rows.map(r => r.provider_name));
}

module.exports = router;
