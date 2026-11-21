'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { firstSeenFor } = require('./firstSeen');

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();
const dayOffset = days => new Date(now + days * DAY_MS).toISOString().split('T')[0];

test('a title we already tracked that gains a service is new, whatever its age', () => {
  assert.equal(firstSeenFor({ isNewTitle: false, releaseDate: dayOffset(-9000), now }), now);
});

test('a recently released title found already streaming is new', () => {
  assert.equal(firstSeenFor({ isNewTitle: true, releaseDate: dayOffset(-30), now }), now);
  assert.equal(firstSeenFor({ isNewTitle: true, releaseDate: dayOffset(10), now }), now);
});

test('an older title found for the first time is never new', () => {
  assert.equal(firstSeenFor({ isNewTitle: true, releaseDate: dayOffset(-200), now }), 0);
  assert.equal(firstSeenFor({ isNewTitle: true, releaseDate: dayOffset(-9000), now }), 0);
});

test('a first-time title with no usable release date is not new', () => {
  assert.equal(firstSeenFor({ isNewTitle: true, releaseDate: null, now }), 0);
  assert.equal(firstSeenFor({ isNewTitle: true, releaseDate: 'nope', now }), 0);
});
