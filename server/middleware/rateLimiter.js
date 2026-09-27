/**
 * In-memory Sliding Window Rate Limiter Middleware
 * Pure Node.js implementation with automatic bucket eviction and standard headers.
 */

function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes default
  max = 10,                   // 10 requests per window
  message = 'Too many requests from this IP, please try again later.',
  statusCode = 429
} = {}) {
  // Map of ip -> array of timestamps
  const hits = new Map();

  // Periodic cleanup every 5 minutes to avoid memory leaks
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < windowMs);
      if (validTimestamps.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000);

  // Unref timer so it does not block Node.js from exiting cleanly
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return function rateLimiter(req, res, next) {
    // Identify client by forwarded-for header or connection remoteAddress
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';

    const now = Date.now();
    let timestamps = hits.get(clientIp) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      const oldest = timestamps[0];
      const resetTime = Math.ceil((oldest + windowMs - now) / 1000);

      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', 0);
      res.setHeader('RateLimit-Reset', resetTime);
      res.setHeader('Retry-After', resetTime);

      return res.status(statusCode).json({
        error: message,
        retryAfter: resetTime
      });
    }

    timestamps.push(now);
    hits.set(clientIp, timestamps);

    const remaining = Math.max(0, max - timestamps.length);
    const resetTime = Math.ceil(windowMs / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTime);

    next();
  };
}

module.exports = { createRateLimiter };
