const { createClient } = require('redis');
const logger = require('../utils/logger');

const url = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const client = createClient({ url });

client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
client.on('connect', () => logger.info('Redis connected'));

let ready = false;

async function connectRedis() {
  if (!ready) {
    await client.connect();
    ready = true;
  }
  return client;
}

// Safe helpers — never crash the request if Redis is momentarily down.
async function cacheGet(key) {
  try {
    if (!ready) return null;
    return await client.get(key);
  } catch (err) {
    logger.warn(`cacheGet failed: ${err.message}`);
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds) {
  try {
    if (!ready) return;
    await client.set(key, value, { EX: ttlSeconds });
  } catch (err) {
    logger.warn(`cacheSet failed: ${err.message}`);
  }
}

async function cacheInvalidate(pattern) {
  try {
    if (!ready) return;
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(keys);
  } catch (err) {
    logger.warn(`cacheInvalidate failed: ${err.message}`);
  }
}

module.exports = { client, connectRedis, cacheGet, cacheSet, cacheInvalidate };
