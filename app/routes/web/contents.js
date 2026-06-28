const router = require('express').Router();

router.get('/', async (req, res) => {
  res.render('contents/list', {
    title: 'Contents',
    active: 'contents',
  });
});

router.get('/:id', async (req, res) => {
  res.render('contents/detail', {
    title: 'Content Detail',
    active: 'contents',
    contentId: req.params.id,
  });
});

module.exports = router;
