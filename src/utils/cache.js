const { redisClient } = require('../config/redis');

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL) || 600;

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (data) {
      console.log(`🟢 Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    console.log(`🔴 Cache MISS: ${key}`);
    return null;
  } catch (err) {
    console.error(`Cache GET error for ${key}:`, err.message);
    return null;
  }
};

const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    console.error(`Cache SET error for ${key}:`, err.message);
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    console.log(`🗑️  Cache DELETE: ${key}`);
  } catch (err) {
    console.error(`Cache DELETE error for ${key}:`, err.message);
  }
};

module.exports = { getCache, setCache, deleteCache };