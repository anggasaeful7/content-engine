const router = require('express').Router();
const prisma = require('../../db');
const { initRedis, enqueue } = require('../../queue');
const { getHashtags } = require('../../../lib/utils/hashtags');
const { scrapeQueue } = initRedis();

// Trigger new scrape
router.post('/', async (req, res) => {
  const { platforms } = req.body;
  const platformList = platforms || ['tiktok'];
  const hashtags = await getHashtags();

  const source = await prisma.source.create({
    data: {
      platform: platformList.join(','),
      hashtags,
      status: 'processing',
    },
  });

  await enqueue(scrapeQueue, 'scrape', {
    sourceId: source.id,
    platforms: platformList,
    hashtags,
  });

  res.json({ success: true, source });
});

// List all sources
router.get('/', async (req, res) => {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { _count: { select: { ideas: true, contents: true } } },
  });
  res.json(sources);
});

// Get single source
router.get('/:id', async (req, res) => {
  const source = await prisma.source.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { _count: { select: { ideas: true, contents: true } } },
  });
  if (!source) return res.status(404).json({ error: 'Not found' });
  res.json(source);
});

module.exports = router;
