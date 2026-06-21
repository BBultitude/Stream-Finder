'use strict';

const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || '/data/streamfinder.db';

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // WAL mode for concurrent read/write safety — required constraint
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      overview TEXT DEFAULT '',
      poster_path TEXT,
      release_date TEXT,
      vote_average REAL DEFAULT 0,
      popularity REAL DEFAULT 0,
      display_status TEXT DEFAULT 'coming_soon',
      last_updated INTEGER NOT NULL,
      runtime INTEGER,
      number_of_seasons INTEGER,
      number_of_episodes INTEGER,
      certification TEXT,
      original_language TEXT,
      PRIMARY KEY (id, media_type)
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_genres (
      content_id INTEGER NOT NULL,
      content_media_type TEXT NOT NULL,
      genre_id INTEGER NOT NULL,
      PRIMARY KEY (content_id, content_media_type, genre_id)
    );

    CREATE TABLE IF NOT EXISTS providers (
      provider_id INTEGER PRIMARY KEY,
      provider_name TEXT NOT NULL,
      logo_path TEXT
    );

    CREATE TABLE IF NOT EXISTS streaming_availability (
      content_id INTEGER NOT NULL,
      content_media_type TEXT NOT NULL,
      provider_id INTEGER NOT NULL,
      region TEXT NOT NULL DEFAULT 'AU',
      type TEXT NOT NULL,
      first_seen INTEGER NOT NULL,
      last_confirmed INTEGER NOT NULL,
      PRIMARY KEY (content_id, content_media_type, provider_id, region, type)
    );

    CREATE TABLE IF NOT EXISTS refresh_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT NOT NULL,
      last_run INTEGER NOT NULL,
      status TEXT NOT NULL,
      records_updated INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_content_popularity
      ON content(popularity DESC);
    CREATE INDEX IF NOT EXISTS idx_content_release_date
      ON content(release_date DESC);
    CREATE INDEX IF NOT EXISTS idx_streaming_content
      ON streaming_availability(content_id, content_media_type);
    CREATE INDEX IF NOT EXISTS idx_streaming_provider
      ON streaming_availability(provider_id, region);
  `);

  // Additive column migrations — safe to run every startup; duplicate-column errors are expected and ignored
  for (const col of [
    'ALTER TABLE content ADD COLUMN runtime INTEGER',
    'ALTER TABLE content ADD COLUMN number_of_seasons INTEGER',
    'ALTER TABLE content ADD COLUMN number_of_episodes INTEGER',
    'ALTER TABLE content ADD COLUMN certification TEXT',
    'ALTER TABLE content ADD COLUMN original_language TEXT',
  ]) {
    try {
      db.exec(col);
      console.log('[db] migration applied:', col.split('COLUMN ')[1].split(' ')[0]);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) throw err;
    }
  }
}

module.exports = { getDb };
