'use strict';

// Environment variables are injected by Docker via --env-file .env at container runtime
const express = require('express');
const { getDb } = require('./db');
const { runInitialRefreshIfNeeded, startCronJobs } = require('./jobs/refresh');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/trending',  require('./routes/trending'));
app.use('/api/new',       require('./routes/new'));
app.use('/api/top10',     require('./routes/top10'));
app.use('/api/browse',    require('./routes/browse'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/detail',    require('./routes/detail'));
app.use('/api/providers', require('./routes/providers'));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM content').get();
    res.json({ status: 'ok', contentCount: count });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── 404 for unknown /api/* paths ────────────────────────────────────────────

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] Listening on 127.0.0.1:${PORT}`);

  if (!process.env.TMDB_API_KEY) {
    console.error('[server] FATAL: TMDB_API_KEY environment variable is not set');
    process.exit(1);
  }

  // Initialise DB schema
  getDb();

  // Populate DB if empty, then start periodic refresh jobs
  runInitialRefreshIfNeeded()
    .then(() => startCronJobs())
    .catch(err => {
      console.error('[server] Startup error:', err.message);
    });
});
