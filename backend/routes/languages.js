'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT original_language AS code, COUNT(*) AS count
      FROM content
      WHERE display_status = 'streaming'
        AND original_language IS NOT NULL
      GROUP BY original_language
      ORDER BY count DESC
    `).all();
    res.json({ languages: rows });
  } catch (err) {
    console.error('[GET /api/languages]', err.message);
    res.status(500).json({ languages: [] });
  }
});

module.exports = router;
