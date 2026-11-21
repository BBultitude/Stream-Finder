'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.TMDB_API_KEY = 'test-key';
const { tmdbGet } = require('./tmdb');

test('during a backoff a single-attempt call fails fast instead of sleeping', async () => {
  // Retry-After as an HTTP date used to turn the backoff into NaN (no backoff at all)
  global.fetch = async () => new Response('', { status: 429, headers: { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' } });
  await assert.rejects(tmdbGet('/movie/1', { maxAttempts: 1 }), /HTTP 429/);

  let called = false;
  global.fetch = async () => { called = true; return Response.json({}); };
  const t0 = Date.now();
  await assert.rejects(tmdbGet('/movie/1', { maxAttempts: 1 }), /rate limited/);
  assert.ok(Date.now() - t0 < 200);
  assert.equal(called, false);
});
