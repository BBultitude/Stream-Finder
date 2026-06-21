'use strict';

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
  const d = Number.parseInt(decade, 10);
  if (!decade || Number.isNaN(d) || d < 1900 || d > 2090) return '';
  params.push(d, d + 9);
  return 'AND CAST(SUBSTR(release_date, 1, 4) AS INTEGER) BETWEEN ? AND ?';
}

function parseLanguages(str) {
  if (!str) return [];
  return str.split(',').filter(Boolean);
}

module.exports = { parseProviderIds, buildTypeClause, buildDecadeClause, parseLanguages };
