/**
 * AI Trend Prediction — analyzes velocity of mentions across scrapes
 * to predict which topics will trend next week.
 */
const prisma = require('../../app/db');

/**
 * Analyze hashtag mention velocity over time and score trending potential.
 */
async function analyze(platform = null) {
  const where = platform ? { platform } : {};

  // Get all sources from last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sources = await prisma.source.findMany({
    where: { ...where, createdAt: { gte: weekAgo }, status: 'completed' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, platform: true, hashtags: true, rawData: true, createdAt: true },
  });

  if (sources.length < 2) return { message: 'Need at least 2 scrapes for trend analysis.', topics: [] };

  // Build keyword frequency timeline per day
  const timeline = {};
  for (const src of sources) {
    const day = src.createdAt.toISOString().slice(0, 10);
    if (!timeline[day]) timeline[day] = {};

    const captions = (src.rawData || []).map((item) => (item.caption || '').toLowerCase()).join(' ');

    for (const tag of src.hashtags || []) {
      const count = (captions.match(new RegExp(tag.replace(/([a-z])([A-Z])/g, '$1 $2'), 'gi')) || []).length;
      timeline[day][tag] = (timeline[day][tag] || 0) + count;
    }
  }

  // Calculate velocity (day-over-day change)
  const days = Object.keys(timeline).sort();
  const topics = [];

  for (const tag of [...new Set(sources.flatMap((s) => s.hashtags || []))]) {
    const mentions = days.map((d) => timeline[d][tag] || 0);
    if (mentions.every((m) => m === 0)) continue;

    const latest = mentions[mentions.length - 1];
    const previous = mentions.length > 1 ? mentions[mentions.length - 2] : mentions[0];
    const velocity = previous > 0 ? ((latest - previous) / previous) * 100 : 100;
    const trendScore = Math.round(
      latest * 10 + (velocity > 0 ? velocity : 0) + (mentions.filter((m) => m > 0).length * 5)
    );

    topics.push({
      keyword: tag.replace(/([a-z])([A-Z])/g, '$1 $2'),
      platform: platform || 'all',
      mentionCount: latest,
      velocity: Math.round(velocity * 100) / 100,
      trendScore,
      prediction: velocity > 20 ? '🔥 Hot — diprediksi naik minggu depan'
        : velocity > 0 ? '📈 Rising — potensi naik'
        : velocity > -20 ? '➡️ Stable'
        : '📉 Declining',
    });
  }

  // Sort by trend score
  topics.sort((a, b) => b.trendScore - a.trendScore);

  // Save to DB
  const recordedAt = new Date();
  for (const t of topics.slice(0, 10)) {
    await prisma.trendingTopic.create({
      data: {
        keyword: t.keyword,
        platform: t.platform,
        mentionCount: t.mentionCount,
        velocity: t.velocity,
        trendScore: t.trendScore,
        recordedAt,
      },
    });
  }

  return { topics, recordedAt, analyzed: sources.length };
}

/**
 * Get prediction insights with actionable recommendations.
 */
async function getInsights() {
  const topics = await prisma.trendingTopic.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 20,
  });

  if (topics.length === 0) return { insights: [], recommendation: 'Run more scrapes to build trend data.' };

  const hotTopics = topics.filter((t) => t.trendScore > 50);
  const risingTopics = topics.filter((t) => t.velocity > 10);

  return {
    hotTopics: hotTopics.map((t) => t.keyword),
    risingTopics: risingTopics.map((t) => t.keyword),
    recommendation: hotTopics.length > 0
      ? `Fokuskan konten ke: ${hotTopics.slice(0, 5).map((t) => t.keyword).join(', ')}. Growth velocity tinggi.`
      : 'Belum ada topik dengan velocity signifikan. Tambah frekuensi scraping.',
    lastUpdated: topics[0]?.recordedAt,
  };
}

module.exports = { analyze, getInsights };
