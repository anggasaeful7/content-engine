const router = require('express').Router();
const prisma = require('../../db');
const trendPrediction = require('../../../lib/analytics/trend-prediction');

// Get trend predictions
router.get('/', async (req, res) => {
  const { platform } = req.query;
  try {
    const result = await trendPrediction.analyze(platform || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get quick insights
router.get('/insights', async (req, res) => {
  try {
    const insights = await trendPrediction.getInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trending topics history
router.get('/history', async (req, res) => {
  const topics = await prisma.trendingTopic.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 50,
  });
  res.json(topics);
});

module.exports = router;
