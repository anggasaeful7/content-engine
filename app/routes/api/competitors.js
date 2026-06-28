const router = require('express').Router();
const competitorIntel = require('../../../lib/analytics/competitor-intelligence');

// List competitors
router.get('/', async (req, res) => {
  try {
    const competitors = await competitorIntel.listCompetitors();
    res.json(competitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add competitor
router.post('/', async (req, res) => {
  try {
    const comp = await competitorIntel.addCompetitor(req.body);
    res.json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze competitor
router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await competitorIntel.analyzeCompetitor(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
