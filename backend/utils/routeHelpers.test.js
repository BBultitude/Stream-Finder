'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseProviderIds, buildTypeClause, buildDecadeClause, buildProviderClause
} = require('./routeHelpers');
const { buildCertClause } = require('./certOrder');

test('parseProviderIds keeps positive integers and ignores junk or arrays', () => {
  assert.deepEqual(parseProviderIds('8,9, 337'), [8, 9, 337]);
  assert.deepEqual(parseProviderIds('8,abc,-1,0,1.5'), [8]);
  assert.deepEqual(parseProviderIds(['8', '9']), []);
  assert.deepEqual(parseProviderIds(undefined), []);
});

test('buildTypeClause only accepts movie or tv', () => {
  const params = [];
  assert.equal(buildTypeClause('tv', params), 'AND media_type = ?');
  assert.deepEqual(params, ['tv']);
  assert.equal(buildTypeClause("movie' OR 1=1", []), '');
});

test('buildDecadeClause bounds the decade and binds start and end years', () => {
  const params = [];
  assert.match(buildDecadeClause('1990', params), /BETWEEN \? AND \?/);
  assert.deepEqual(params, [1990, 1999]);
  assert.equal(buildDecadeClause('1800', []), '');
  assert.equal(buildDecadeClause('abc', []), '');
});

test('buildProviderClause only matches flat-rate AU rows and binds ids in order', () => {
  const params = ['first'];
  const sql = buildProviderClause([8, 9], params);
  assert.match(sql, /sa\.type = 'flatrate'/);
  assert.match(sql, /sa\.region = 'AU'/);
  assert.deepEqual(params, ['first', 8, 9]);
  assert.equal(buildProviderClause([], []), '');
});

test('buildCertClause allows everything up to the ceiling', () => {
  const params = [];
  assert.match(buildCertClause('PG', params), /certification IN \(\?,\?,\?\)/);
  assert.deepEqual(params, ['E', 'G', 'PG']);
  assert.equal(buildCertClause('XYZ', []), '');
});
