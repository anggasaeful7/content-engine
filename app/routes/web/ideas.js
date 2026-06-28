const router = require('express').Router();

router.get('/', async (req, res) => {
  res.render('ideas/list', {
    title: 'Content Ideas',
    active: 'ideas',
    sourceId: req.query.source_id || null,
  });
});

module.exports = router;
