const router = require('express').Router();
const prisma = require('../../db');

router.get('/', async (req, res) => {
  res.render('competitors/list', { title: 'Competitor Intelligence', active: 'competitors' });
});

router.get('/new', async (req, res) => {
  res.render('competitors/new', { title: 'Add Competitor', active: 'competitors' });
});

module.exports = router;
