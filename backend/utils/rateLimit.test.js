'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('./rateLimit');

function hit(limiter, ip) {
  let status = 200;
  let passed = false;
  const res = { status(code) { status = code; return this; }, json() {} };
  limiter({ ip }, res, () => { passed = true; });
  return { status, passed };
}

test('blocks an IP after max requests but keeps other IPs working', () => {
  const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
  for (let i = 0; i < 3; i++) assert.equal(hit(limiter, '1.1.1.1').passed, true);
  const blocked = hit(limiter, '1.1.1.1');
  assert.equal(blocked.passed, false);
  assert.equal(blocked.status, 429);
  assert.equal(hit(limiter, '2.2.2.2').passed, true);
});
