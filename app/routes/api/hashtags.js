const prisma = require('../../db');
const router = require('express').Router();

router.get('/', async (req, res) => {
  const hashtags = await prisma.hashtag.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (req.get('HX-Request')) {
    return res.send(hashtags.map(h =>
      `<span class="badge badge-brand" style="cursor:pointer" onclick="toggleHashtag(${h.id})">#${h.tag}</span>`
    ).join(' '));
  }
  res.json(hashtags);
});

router.post('/', async (req, res) => {
  const { tag } = req.body;
  if (!tag) return res.status(400).json({ error: 'Tag required' });
  const clean = tag.replace(/^#/, '').trim().toLowerCase();
  try {
    res.json(await prisma.hashtag.create({ data: { tag: clean, platform: 'all' } }));
  } catch { res.status(400).json({ error: 'Already exists' }); }
});

router.patch('/:id/toggle', async (req, res) => {
  const h = await prisma.hashtag.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!h) return res.status(404).json({ error: 'Not found' });
  res.json(await prisma.hashtag.update({ where: { id: h.id }, data: { isActive: !h.isActive } }));
});

router.delete('/:id', async (req, res) => {
  await prisma.hashtag.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

module.exports = router;
