'use strict';

/**
 * Per-IP sliding-window limiter as Express middleware.
 * req.ip is the real client because server.js trusts the Nginx loopback proxy.
 */
function createRateLimiter({ max, windowMs }) {
  const hits = new Map();

  // Drop IPs that have gone quiet so the map doesn't grow forever
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, times] of hits) {
      if (times[times.length - 1] <= cutoff) hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || 'unknown';
    const times = (hits.get(ip) || []).filter(t => t > now - windowMs);
    if (times.length >= max) {
      hits.set(ip, times);
      return res.status(429).json({ error: 'Too many requests' });
    }
    times.push(now);
    hits.set(ip, times);
    next();
  };
}

module.exports = { createRateLimiter };
