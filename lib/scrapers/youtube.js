/**
 * YouTube scraper via Apify Actor: api-ninja/youtube-search-scraper
 * Searches each query keyword individually, merges results.
 * Returns normalized data: [{ views, likes, caption, url, platform }]
 */

const { ApifyClient } = require('apify-client');
const { getHashtags } = require('../utils/hashtags');

async function scrape(platformCfg) {
  const token = process.env.APIFY_TOKEN;
  const client = new ApifyClient({ token });

  // Each hashtag becomes an individual search query (max 3)
  const hashtags = await getHashtags();
  const queries = hashtags
    .map((tag) => tag.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .slice(0, 3);

  const allItems = [];
  const limit = platformCfg.resultsPerPage || 10;

  for (const query of queries) {
    const input = {
      query,
      local: platformCfg.local || false,
      scrapeAllResults: platformCfg.scrapeAllResults || false,
    };

    console.log(`   Actor: ${platformCfg.actorId} | Query: "${query}"`);
    const run = await client.actor(platformCfg.actorId).call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (items && items.length > 0) {
      const mapped = items.slice(0, Math.ceil(limit / queries.length)).map(
        (video) => ({
          views: video.views || video.viewCount || 0,
          likes: video.likes || video.likeCount || 0,
          caption: video.title || '',
          url: video.url || video.link || '',
          platform: 'youtube',
        })
      );
      allItems.push(...mapped);
    }

    // Stop early if we have enough
    if (allItems.length >= limit) break;
  }

  console.log(`   Got ${allItems.length} items total`);
  return allItems.slice(0, limit);
}

module.exports = { scrape };
