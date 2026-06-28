const router = require('express').Router();
const prisma = require('../../db');

// Dashboard analytics
router.get('/dashboard', async (req, res) => {
  const [sourceCount, ideaCount, ideasPending, contentCount, contentPublished] = await Promise.all([
    prisma.source.count(),
    prisma.contentIdea.count(),
    prisma.contentIdea.count({ where: { status: 'pending' } }),
    prisma.content.count(),
    prisma.content.count({ where: { status: 'published' } }),
  ]);

  // Recent activity
  const recentSources = await prisma.source.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, platform: true, rawItemsCount: true, status: true, createdAt: true },
  });

  // Top performing ideas
  const topIdeas = await prisma.contentIdea.findMany({
    where: { status: 'approved' },
    orderBy: { qualityScore: 'desc' },
    take: 10,
    select: { id: true, title: true, qualityScore: true, contentType: true, targetPlatform: true },
  });

  // Content by status
  const contentByStatus = await prisma.content.groupBy({
    by: ['status'],
    _count: true,
  });

  res.json({
    counts: { sources: sourceCount, ideas: ideaCount, ideasPending, contents: contentCount, published: contentPublished },
    recentSources,
    topIdeas,
    contentByStatus,
  });
});

module.exports = router;
