const router = require('express').Router();

router.get('/', async (req, res) => {
  res.render('dashboard/home', {
    title: 'Dashboard',
    active: 'dashboard',
  });
});

module.exports = router;
