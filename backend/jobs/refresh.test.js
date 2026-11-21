'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-refresh-'));
process.env.DB_PATH = path.join(dir, 'test.db');
process.env.TMDB_API_KEY = 'test-key';
const { getDb } = require('../db');
const { upsertContent, fetchAndStoreDetail } = require('./refresh');

const DAY_MS = 24 * 60 * 60 * 1000;
const provider = (id, name) => ({ provider_id: id, provider_name: name, logo_path: null });
const tmdbResponse = flatrate => ({
  status: 'Released', release_date: '1995-01-01', runtime: 100,
  'watch/providers': { results: { AU: { flatrate } } },
  release_dates: { results: [] }
});
const stubTmdb = body => { global.fetch = async () => (body ? Response.json(body) : new Response('', { status: 500 })); };
const rows = db => db.prepare('SELECT provider_id, first_seen FROM streaming_availability ORDER BY provider_id').all();

test('first_seen survives refreshes, stale rows go only after the grace period, failures change nothing', async () => {
  const db = getDb();
  const t1 = Date.now();
  upsertContent(db, { id: 1, media_type: 'movie', title: 'Old film' }, t1);

  stubTmdb(tmdbResponse([provider(8, 'Netflix'), provider(21, 'Stan')]));
  assert.equal(await fetchAndStoreDetail(db, 1, 'movie', t1, { isNewTitle: false }), true);
  assert.deepEqual(rows(db), [{ provider_id: 8, first_seen: t1 }, { provider_id: 21, first_seen: t1 }]);

  // Netflix missing for one run: kept, so a data flicker cannot reset its first_seen
  stubTmdb(tmdbResponse([provider(21, 'Stan')]));
  await fetchAndStoreDetail(db, 1, 'movie', t1 + DAY_MS, { isNewTitle: false });
  assert.deepEqual(rows(db).map(r => r.provider_id), [8, 21]);

  // Still missing past the grace period: gone. Stan keeps its original first_seen.
  await fetchAndStoreDetail(db, 1, 'movie', t1 + 5 * DAY_MS, { isNewTitle: false });
  assert.deepEqual(rows(db), [{ provider_id: 21, first_seen: t1 }]);

  // TMDB down: reports failure and leaves display_status alone
  stubTmdb(null);
  assert.equal(await fetchAndStoreDetail(db, 1, 'movie', t1 + 6 * DAY_MS, { isNewTitle: false }), false);
  const { display_status } = db.prepare('SELECT display_status FROM content WHERE id = 1').get();
  assert.equal(display_status, 'streaming');
});
