/**
 * Unified scraper interface.
 * Provides runAll() to scrape all enabled platforms in parallel.
 *
 * Each scraper module must export:
 *   scrape(config) => [{ views, likes, caption, url, platform }]
 */

const config = require('../../config');

/**
 * Run scraper for a single platform.
 */
async function run(platform, platformCfg) {
  const scraper = require(`./${platform}`);
  return scraper.scrape(platformCfg);
}

/**
 * Run all enabled platforms in parallel.
 * Returns { platform: [...items] }
 */
async function runAll() {
  const enabled = Object.entries(config.platforms).filter(([, cfg]) => cfg.enabled);

  if (enabled.length === 0) {
    console.log('No platforms enabled in config.');
    return {};
  }

  const results = await Promise.allSettled(
    enabled.map(([name, cfg]) =>
      run(name, cfg).then((data) => ({ platform: name, data }))
    )
  );

  const output = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      output[result.value.platform] = result.value.data;
    } else {
      console.error(`Scraper failed: ${result.reason.message}`);
    }
  }
  return output;
}

module.exports = { run, runAll };
