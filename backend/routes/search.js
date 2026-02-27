'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { shapeItem, buildStreamingMap } = require('../utils/contentHelper');

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

    // Enrich with AU streaming from DB (best-effort — items not in DB get empty streaming)
    const db = getDb();
    const streamingMap = buildStreamingMap(db, items);

    const providerIds = parseProviderIds(providers);

    let results = items.map(item => {
      const key = `${item.id}_${item.media_type}`;
      const streaming = streamingMap[key] || [];
      // genre_ids come from TMDB search response
      return shapeItem(item, streaming, item.genre_ids || []);
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

function getAllowedProviderNames(db, providerIds) {
  if (providerIds.length === 0) return new Set();
  const ph = providerIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT provider_name FROM providers WHERE provider_id IN (${ph})
  `).all(...providerIds);
  return new Set(rows.map(r => r.provider_name));
}

module.exports = router;
