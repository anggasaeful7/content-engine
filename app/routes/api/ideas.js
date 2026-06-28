const router = require('express').Router();
const prisma = require('../../db');
const { initRedis, enqueue } = require('../../queue');
const { contentQueue } = initRedis();

// List ideas (with filters) - supports HTMX EJS rendering
router.get('/', async (req, res) => {
  const { sourceId, status, type, search, page = 1, limit = 50 } = req.query;

  const where = {};
  if (sourceId) where.sourceId = parseInt(sourceId);
  if (status) where.status = status;
  if (type) where.contentType = type;
  if (search) where.title = { contains: search };

  const [ideas, total] = await Promise.all([
    prisma.contentIdea.findMany({
      where,
      orderBy: { qualityScore: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { source: { select: { platform: true } } },
    }),
    prisma.contentIdea.count({ where }),
  ]);

  // HTMX request → render EJS rows
  if (req.get('HX-Request')) {
    return res.render('ideas/rows', { ideas, layout: false });
  }

  res.json({ ideas, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// Approve single idea → trigger content production
router.patch('/:id/approve', async (req, res) => {
  const id = parseInt(req.params.id);

  const idea = await prisma.contentIdea.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date() },
  });

  // Enqueue content production
  await enqueue(contentQueue, 'produce-content', { ideaId: idea.id });

  res.json({ success: true, idea });
});

// Bulk approve
router.post('/approve-bulk', async (req, res) => {
  const { ids } = req.body; // [1, 2, 3]

  await prisma.contentIdea.updateMany({
    where: { id: { in: ids.map(Number) } },
    data: { status: 'approved', approvedAt: new Date() },
  });

  // Enqueue all for content production
  for (const id of ids) {
    await enqueue(contentQueue, 'produce-content', { ideaId: parseInt(id) });
  }

  res.json({ success: true, approved: ids.length });
});

// Reject idea
router.patch('/:id/reject', async (req, res) => {
  const idea = await prisma.contentIdea.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'rejected' },
  });
  res.json({ success: true, idea });
});

module.exports = router;
