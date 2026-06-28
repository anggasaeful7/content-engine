/**
 * Instagram scraper via Apify Actor: apify/instagram-scraper
 * Searches hashtags by constructing explore/tags/ URLs as directUrls.
 * Returns normalized data: [{ views, likes, caption, url, platform }]
 */

const { ApifyClient } = require('apify-client');
const { getHashtags } = require('../utils/hashtags');

async function scrape(platformCfg) {
  const token = process.env.APIFY_TOKEN;
  const client = new ApifyClient({ token });

  // Build direct URLs to hashtag explore pages (ambil 3 hashtag pertama)
  const hashtags = await getHashtags();
  const directUrls = hashtags.slice(0, platformCfg.searchLimit || 3).map(
    (tag) => `https://www.instagram.com/explore/tags/${tag}/`
  );

  const input = {
    directUrls,
    resultsType: 'posts',
    resultsLimit: platformCfg.resultsPerPage || 10,
    searchType: platformCfg.scraperType || 'hashtag',
    searchLimit: platformCfg.searchLimit || 3,
    addParentData: false,
  };

  console.log(`   Actor: ${platformCfg.actorId}`);
  console.log(`   Hashtags: ${hashtags.join(', ')}`);
  const run = await client.actor(platformCfg.actorId).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) return [];

  const validItems = items.filter(
    (post) => post.caption || post.url || post.shortCode
  );
  if (validItems.length === 0) return [];

  console.log(`   Got ${validItems.length} valid items`);

  return validItems.map((post) => ({
    views: post.videoViewCount || post.videoPlayCount || post.viewsCount || 0,
    likes: post.likesCount || post.likes || 0,
    caption: post.caption || post.text || '',
    url:
      post.url ||
      (post.shortCode ? `https://instagram.com/p/${post.shortCode}` : ''),
    platform: 'instagram',
  }));
}

module.exports = { scrape };
