'use strict';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

/**
 * Attach streaming (flatrate AU) and genre_ids to a list of content rows,
 * then shape them into the API response format the frontend expects.
 *
 * Uses 2 bulk SQL queries (one per media_type) rather than N per-item
 * queries, keeping total latency well under 200ms for up to 100 items.
 *
 * @param {object} db          better-sqlite3 db instance
 * @param {Array}  items       rows from the content table
 * @returns {Array}            shaped content objects with streaming + genre_ids
 */
function attachStreamingAndGenres(db, items) {
  if (items.length === 0) return [];

  const streamingMap = buildStreamingMap(db, items);
  const genreMap = buildGenreMap(db, items);

  return items.map(item => {
    const key = `${item.id}_${item.media_type}`;
    return shapeItem(item, streamingMap[key] || [], genreMap[key] || []);
  });
}

/**
 * Shape a DB content row into the API response object.
 * Outputs both `title` and `name` fields for React frontend compatibility
 * (frontend uses `item.title || item.name` everywhere).
 */
function shapeItem(item, streaming, genreIds) {
  const isMovie = item.media_type === 'movie';
  // DB rows store everything in `title`; TMDB API responses use `name` for TV shows
  const displayName = item.title || item.name || 'Unknown';
  return {
    id: item.id,
    media_type: item.media_type,
    title: isMovie ? displayName : undefined,
    name: isMovie ? undefined : displayName,
    overview: item.overview || '',
    poster_path: item.poster_path || null,
    release_date: isMovie ? (item.release_date || null) : undefined,
    first_air_date: isMovie ? undefined : (item.release_date || null),
    vote_average: item.vote_average || 0,
    popularity: item.popularity || 0,
    display_status: item.display_status || 'coming_soon',
    genre_ids: genreIds,
    streaming
  };
}

/**
 * Fetch flatrate AU streaming providers for a list of content items.
 * Returns a map keyed by `${id}_${media_type}`.
 */
function buildStreamingMap(db, items) {
  const map = {};
  const movieIds = items.filter(i => i.media_type === 'movie').map(i => i.id);
  const tvIds = items.filter(i => i.media_type === 'tv').map(i => i.id);

  for (const [mediaType, ids] of [['movie', movieIds], ['tv', tvIds]]) {
    if (ids.length === 0) continue;
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT sa.content_id, p.provider_name, p.logo_path
      FROM streaming_availability sa
      JOIN providers p ON p.provider_id = sa.provider_id
      WHERE sa.content_media_type = ?
        AND sa.content_id IN (${placeholders})
        AND sa.region = 'AU'
        AND sa.type = 'flatrate'
    `).all(mediaType, ...ids);

    for (const row of rows) {
      const key = `${row.content_id}_${mediaType}`;
      if (!map[key]) map[key] = [];
      map[key].push({
        name: row.provider_name,
        logo: row.logo_path ? `${TMDB_IMAGE_BASE}${row.logo_path}` : ''
      });
    }
  }

  return map;
}

/**
 * Fetch genre IDs for a list of content items.
 * Returns a map keyed by `${id}_${media_type}`.
 */
function buildGenreMap(db, items) {
  const map = {};
  const movieIds = items.filter(i => i.media_type === 'movie').map(i => i.id);
  const tvIds = items.filter(i => i.media_type === 'tv').map(i => i.id);

  for (const [mediaType, ids] of [['movie', movieIds], ['tv', tvIds]]) {
    if (ids.length === 0) continue;
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT content_id, genre_id FROM content_genres
      WHERE content_media_type = ? AND content_id IN (${placeholders})
    `).all(mediaType, ...ids);

    for (const row of rows) {
      const key = `${row.content_id}_${mediaType}`;
      if (!map[key]) map[key] = [];
      map[key].push(row.genre_id);
    }
  }

  return map;
}

module.exports = { attachStreamingAndGenres, shapeItem, buildStreamingMap };
