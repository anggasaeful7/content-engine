const { initRedis } = require('../queue');
const { connection, Worker } = initRedis();
const { ideasQueue } = initRedis();
const prisma = require('../db');
const config = require('../../config');

async function runScrape(job) {
  const { sourceId, platforms, hashtags } = job.data;
  console.log(`🔍 Scrape job started: source #${sourceId}`);

  try {
    let allItems = [];

    for (const platform of platforms) {
      const scraper = require(`../../lib/scrapers/${platform}`);
      const items = await scraper.scrape({ ...config.platforms[platform], hashtags });
      allItems.push(...items.map(i => ({ ...i, platform })));
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        rawItemsCount: allItems.length,
        rawData: allItems.slice(0, 30),
        status: 'completed',
      },
    });

    // Auto-trigger idea generation
    await ideasQueue.add('generate-ideas', { sourceId, items: allItems.slice(0, 30) });

    console.log(`✅ Scrape done: ${allItems.length} items`);
  } catch (err) {
    console.error(`❌ Scrape failed: ${err.message}`);
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'failed', errorLog: err.message },
    });
  }
}

const worker = new Worker('scrape', runScrape, { connection, concurrency: 2 });
console.log('👷 Scrape worker ready');
