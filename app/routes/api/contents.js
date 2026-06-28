const router = require('express').Router();
const prisma = require('../../db');

// List contents
router.get('/', async (req, res) => {
  const { status, type, page = 1, limit = 10 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.contentType = type;

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { idea: { select: { title: true, deepseekReasoning: true } } },
    }),
    prisma.content.count({ where }),
  ]);

  res.json({ contents, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// Get content detail
router.get('/:id', async (req, res) => {
  const content = await prisma.content.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      idea: { select: { title: true, deepseekReasoning: true, referenceData: true } },
      source: { select: { platform: true, hashtags: true } },
      analytics: { orderBy: { recordedAt: 'desc' }, take: 30 },
    },
  });
  if (!content) return res.status(404).json({ error: 'Not found' });
  res.json(content);
});

// Update content status
router.patch('/:id', async (req, res) => {
  const { status, publishedUrl } = req.body;
  const data = { status };
  if (publishedUrl) data.publishedUrl = publishedUrl;
  if (status === 'published') data.publishedAt = new Date();

  const content = await prisma.content.update({
    where: { id: parseInt(req.params.id) },
    data,
  });
  res.json(content);
});

module.exports = router;
