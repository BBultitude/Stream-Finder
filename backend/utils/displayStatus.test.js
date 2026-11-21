'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { computeDisplayStatus } = require('./displayStatus');

const DAY_MS = 24 * 60 * 60 * 1000;
const dayOffset = days => new Date(Date.now() + days * DAY_MS).toISOString().split('T')[0];
const classify = overrides => computeDisplayStatus({
  tmdbStatus: 'Released', releaseDate: dayOffset(-400), hasAuStreaming: false, mediaType: 'movie', ...overrides
});

test('confirmed AU streaming overrides every other signal', () => {
  assert.equal(classify({ hasAuStreaming: true, tmdbStatus: 'Planned', releaseDate: dayOffset(30) }), 'streaming');
});

test('pre-release TMDB statuses are coming_soon even with a past date', () => {
  for (const tmdbStatus of ['Rumored', 'Planned', 'In Production', 'Post Production']) {
    assert.equal(classify({ tmdbStatus, releaseDate: dayOffset(-10) }), 'coming_soon', tmdbStatus);
  }
});

test('future release date is coming_soon', () => {
  assert.equal(classify({ releaseDate: dayOffset(20) }), 'coming_soon');
});

test('movie released within 90 days with no streaming is in_cinemas', () => {
  assert.equal(classify({ releaseDate: dayOffset(-80) }), 'in_cinemas');
});

test('TV released within 90 days with no streaming is unavailable, never in_cinemas', () => {
  assert.equal(classify({ mediaType: 'tv', releaseDate: dayOffset(-80) }), 'unavailable');
});

test('released over 90 days ago with no streaming is unavailable', () => {
  assert.equal(classify({ releaseDate: dayOffset(-100) }), 'unavailable');
});

test('missing or invalid release date is coming_soon', () => {
  assert.equal(classify({ releaseDate: null }), 'coming_soon');
  assert.equal(classify({ releaseDate: 'not-a-date' }), 'coming_soon');
});

test('an unexpected TMDB status falls through to the date rules', () => {
  assert.equal(classify({ tmdbStatus: 'Something New', releaseDate: dayOffset(-100) }), 'unavailable');
  assert.equal(classify({ tmdbStatus: null, releaseDate: dayOffset(-80) }), 'in_cinemas');
});
