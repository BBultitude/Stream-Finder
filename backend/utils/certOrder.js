'use strict';

// AU classification order from least to most restrictive.
// Verify string values against actual DB: SELECT DISTINCT certification FROM content WHERE certification IS NOT NULL;
const AU_CERT_ORDER = ['E', 'G', 'PG', 'M', 'MA15+', 'R18+'];

function certsUpTo(max) {
  const idx = AU_CERT_ORDER.indexOf(max);
  return idx === -1 ? null : AU_CERT_ORDER.slice(0, idx + 1);
}

module.exports = { AU_CERT_ORDER, certsUpTo };
