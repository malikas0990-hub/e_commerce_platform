const { cacheGet, cacheSet } = require('../config/redis');

// Caches GET responses in Redis for `ttl` seconds. Falls through gracefully
// if Redis is unavailable (cacheGet/cacheSet swallow errors and return null).
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await cacheGet(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
    res.set('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) cacheSet(key, JSON.stringify(body), ttl);
      return originalJson(body);
    };
    next();
  };
}

module.exports = { cacheMiddleware };
