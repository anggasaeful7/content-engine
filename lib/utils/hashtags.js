/**
 * Get active hashtags from database. Falls back to config.js if DB empty.
 */
const prisma = require('../../app/db');
const config = require('../../config');

let cache = null;
let cacheTime = 0;
const TTL = 60000; // 1 minute

async function getHashtags() {
  if (cache && Date.now() - cacheTime < TTL) return cache;

  try {
    const rows = await prisma.hashtag.findMany({ where: { isActive: true } });
    if (rows.length > 0) {
      cache = rows.map((r) => r.tag);
      cacheTime = Date.now();
      return cache;
    }
  } catch (err) {
    // DB might not be ready — fall back to config
  }

  return config.hashtags;
}

module.exports = { getHashtags };
