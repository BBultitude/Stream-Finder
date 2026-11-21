'use strict';

function parseProviderIds(str) {
  if (typeof str !== 'string') return [];
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
  const d = Number.parseInt(decade, 10);
  if (!decade || Number.isNaN(d) || d < 1900 || d > 2090) return '';
  params.push(d, d + 9);
  return 'AND CAST(SUBSTR(release_date, 1, 4) AS INTEGER) BETWEEN ? AND ?';
}

// Columns every list endpoint returns; queries alias the table as `c`
const CONTENT_COLS = `c.id, c.media_type, c.title, c.overview, c.poster_path,
  c.release_date, c.vote_average, c.popularity, c.display_status,
  c.runtime, c.number_of_seasons, c.number_of_episodes, c.certification`;

// Keeps titles that are on a flat-rate (subscription) AU service from the given providers.
// Rent/buy rows must not count: a title rentable on Prime is not "on Prime".
function buildProviderClause(providerIds, params) {
  if (providerIds.length === 0) return '';
  params.push(...providerIds);
  const ph = providerIds.map(() => '?').join(',');
  return `AND EXISTS (
    SELECT 1 FROM streaming_availability sa
    WHERE sa.content_id = c.id AND sa.content_media_type = c.media_type
      AND sa.region = 'AU' AND sa.type = 'flatrate' AND sa.provider_id IN (${ph}))`;
}

module.exports = { parseProviderIds, buildTypeClause, buildDecadeClause, buildProviderClause, CONTENT_COLS };
