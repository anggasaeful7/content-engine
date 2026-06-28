const router = require('express').Router();

router.get('/', async (req, res) => {
  res.render('sources/list', {
    title: 'Sources',
    active: 'sources',
  });
});

router.get('/new', async (req, res) => {
  res.render('sources/new', { title: 'New Scrape', active: 'sources' });
});

module.exports = router;
