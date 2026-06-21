'use strict';

// AU classification order from least to most restrictive.
// Verify string values against actual DB: SELECT DISTINCT certification FROM content WHERE certification IS NOT NULL;
const AU_CERT_ORDER = ['E', 'G', 'PG', 'M', 'MA15+', 'R18+'];

function certsUpTo(max) {
  const idx = AU_CERT_ORDER.indexOf(max);
  return idx === -1 ? null : AU_CERT_ORDER.slice(0, idx + 1);
}

function buildCertClause(maxCertification, params) {
  if (!maxCertification) return '';
  const certs = certsUpTo(maxCertification);
  if (!certs) return '';
  certs.forEach(c => params.push(c));
  const ph = certs.map(() => '?').join(',');
  return `AND certification IN (${ph})`;
}

function buildExcludeLanguagesClause(languages, params) {
  if (!languages || languages.length === 0) return '';
  languages.forEach(l => params.push(l));
  const ph = languages.map(() => '?').join(',');
  return `AND (original_language IS NULL OR original_language NOT IN (${ph}))`;
}

module.exports = { AU_CERT_ORDER, certsUpTo, buildCertClause, buildExcludeLanguagesClause };
