/**
 * TikTok scraper via Apify Actor: clockworks/tiktok-scraper
 * Returns normalized data: [{ views, likes, caption, url, platform }]
 */

const { ApifyClient } = require('apify-client');
const { getHashtags } = require('../utils/hashtags');

async function scrape(platformCfg) {
  const token = process.env.APIFY_TOKEN;
  const client = new ApifyClient({ token });

  const hashtags = await getHashtags();
  const input = {
    hashtags,
    resultsPerPage: platformCfg.resultsPerPage || 5,
    shouldDownloadVideos: false,
  };

  console.log(`   Actor: ${platformCfg.actorId}`);
  const run = await client.actor(platformCfg.actorId).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) return [];

  return items.map((video) => ({
    views: video.playCount || 0,
    likes: video.diggCount || 0,
    caption: video.text || '',
    url: video.webVideoUrl || '',
    platform: 'tiktok',
  }));
}

module.exports = { scrape };
