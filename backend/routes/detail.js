'use strict';

const { Router } = require('express');
const { getDb } = require('../db');
const { shapeItem, buildStreamingMap } = require('../utils/contentHelper');

const router = Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Simple in-process cache for detail responses (1-hour TTL)
// Prevents repeated TMDB calls when multiple users view the same item
const detailCache = new Map();
const DETAIL_TTL_MS = 60 * 60 * 1000;

/**
 * GET /api/detail/:type/:id
 * Returns full detail for a content item including:
 *   - imdb_id (from TMDB external_ids)
 *   - recommendations (with streaming info, from TMDB + DB enrichment)
 *
 * Content base data is served from the DB if available; otherwise from TMDB.
 * API key stays server-side.
 */
router.get('/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const contentId = parseInt(id, 10);

  if (!['movie', 'tv'].includes(type) || !Number.isInteger(contentId) || contentId <= 0) {
    return res.status(400).json({ error: 'Invalid type or id' });
  }

  const cacheKey = `${type}_${contentId}`;
  const cached = detailCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < DETAIL_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) throw new Error('TMDB_API_KEY not configured');

    // Fetch external_ids and recommendations in parallel
    const [externalIds, recsData] = await Promise.all([
      tmdbGet(`/${type}/${contentId}/external_ids`, apiKey),
      fetchRecommendations(type, contentId, apiKey)
    ]);

    // Enrich recommendations with AU streaming from DB
    const db = getDb();
    const streamingMap = buildStreamingMap(db, recsData);
    const recommendations = recsData.map(item => {
      const key = `${item.id}_${item.media_type || type}`;
      return shapeItem(
        { ...item, media_type: item.media_type || type },
        streamingMap[key] || [],
        item.genre_ids || []
      );
    });

    const result = {
      imdb_id: externalIds.imdb_id || null,
      recommendations
    };

    detailCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    console.error(`[GET /api/detail/${type}/${contentId}]`, err.message);
    res.status(500).json({ imdb_id: null, recommendations: [], error: 'Failed to load detail' });
  }
});

async function fetchRecommendations(type, id, apiKey) {
  try {
    const data = await tmdbGet(`/${type}/${id}/recommendations?page=1`, apiKey);
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 12).map(r => ({ ...r, media_type: r.media_type || type }));
    }
  } catch {
    // fall through to similar
  }

  try {
    const data = await tmdbGet(`/${type}/${id}/similar?page=1`, apiKey);
    return (data.results || []).slice(0, 12).map(r => ({ ...r, media_type: type }));
  } catch {
    return [];
  }
}

async function tmdbGet(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${apiKey}`);
  if (!res.ok) throw new Error(`TMDB ${path} returned HTTP ${res.status}`);
  return res.json();
}

module.exports = router;
