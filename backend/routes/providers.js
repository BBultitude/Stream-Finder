'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// Hardcoded AU streaming services — the canonical list for filtering
// Used as fallback if the DB providers table is empty
const AU_PROVIDERS = [
  { provider_id: 8,    provider_name: 'Netflix',           logo_path: null },
  { provider_id: 9,    provider_name: 'Amazon Prime Video', logo_path: null },
  { provider_id: 21,   provider_name: 'Stan',               logo_path: null },
  { provider_id: 531,  provider_name: 'Paramount Plus',     logo_path: null },
  { provider_id: 337,  provider_name: 'Disney Plus',        logo_path: null },
  { provider_id: 385,  provider_name: 'Binge',              logo_path: null },
  { provider_id: 1899, provider_name: 'Max',                logo_path: null }
];

/**
 * GET /api/providers
 * Returns the list of AU streaming providers, drawing logos from the DB
 * where available (populated by the refresh job) and falling back to the
 * hardcoded list for providers not yet seen.
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const knownIds = AU_PROVIDERS.map(p => p.provider_id);
    const ph = knownIds.map(() => '?').join(',');

    const dbProviders = db.prepare(`
      SELECT provider_id, provider_name, logo_path
      FROM providers
      WHERE provider_id IN (${ph})
    `).all(...knownIds);

    const dbMap = new Map(dbProviders.map(p => [p.provider_id, p]));

    const result = AU_PROVIDERS.map(p => dbMap.get(p.provider_id) || p);
    res.json({ providers: result });
  } catch (err) {
    console.error('[GET /api/providers]', err.message);
    res.json({ providers: AU_PROVIDERS });
  }
});

module.exports = router;
