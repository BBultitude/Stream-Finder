'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    // Guard: column may be absent on DBs created before this migration ran
    const cols = db.prepare('PRAGMA table_info(content)').all();
    if (!cols.some(c => c.name === 'original_language')) {
      return res.json({ languages: [] });
    }
    const rows = db.prepare(`
      SELECT original_language AS code, COUNT(*) AS item_count
      FROM content
      WHERE display_status = 'streaming'
        AND original_language IS NOT NULL
      GROUP BY original_language
      ORDER BY item_count DESC
    `).all();
    res.json({ languages: rows });
  } catch (err) {
    console.error('[GET /api/languages]', err.stack || err.message);
    res.json({ languages: [] }); // Always 200 — errors logged but never surfaced to the client
  }
});

module.exports = router;
