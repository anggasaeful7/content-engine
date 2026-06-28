/**
 * Competitor Intelligence — track competitors, scrape their content,
 * and reverse-engineer their strategy.
 */
const { ApifyClient } = require('apify-client');
const axios = require('axios');
const prisma = require('../../app/db');

/**
 * Add a competitor to track.
 */
async function addCompetitor({ name, platform, handle, profileUrl, notes }) {
  return prisma.competitor.create({
    data: { name, platform, handle, profileUrl, notes },
  });
}

/**
 * List all tracked competitors.
 */
async function listCompetitors() {
  return prisma.competitor.findMany({
    where: { isActive: true },
    include: { analyses: { orderBy: { scrapedAt: 'desc' }, take: 1 } },
  });
}

/**
 * Scrape a competitor's content and analyze their strategy.
 */
async function analyzeCompetitor(competitorId) {
  const competitor = await prisma.competitor.findUnique({ where: { id: competitorId } });
  if (!competitor) throw new Error('Competitor not found');

  const token = process.env.APIFY_TOKEN;
  const client = new ApifyClient({ token });
  let items = [];

  try {
    if (competitor.platform === 'instagram') {
      const run = await client.actor('apify/instagram-scraper').call({
        directUrls: [competitor.profileUrl],
        resultsType: 'posts',
        resultsLimit: 20,
      });
      const data = await client.dataset(run.defaultDatasetId).listItems();
      items = data.items || [];
    } else if (competitor.platform === 'tiktok') {
      // TikTok competitor scrape via username
      const run = await client.actor('clockworks/tiktok-scraper').call({
        profiles: [competitor.handle],
        resultsPerPage: 20,
        shouldDownloadVideos: false,
      });
      const data = await client.dataset(run.defaultDatasetId).listItems();
      items = data.items || [];
    }
  } catch (err) {
    console.error(`Competitor scrape failed: ${err.message}`);
  }

  if (items.length === 0) {
    return { message: `No content found for ${competitor.name}`, competitor };
  }

  // Compute metrics
  const totalPosts = items.length;
  const avgViews = Math.round(items.reduce((s, i) => s + (i.playCount || i.videoPlayCount || 0), 0) / totalPosts);
  const totalLikes = items.reduce((s, i) => s + (i.diggCount || i.likesCount || 0), 0);
  const totalViews = items.reduce((s, i) => s + (i.playCount || i.videoPlayCount || 0), 0);
  const avgEngagement = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0;

  // Extract top hashtags
  const hashtagFreq = {};
  for (const item of items) {
    const hashtags = (item.text || item.caption || '').match(/#\w+/g) || [];
    for (const tag of hashtags) {
      hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1;
    }
  }
  const topHashtags = Object.entries(hashtagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Detect content formats
  const formats = {
    tutorial: items.filter((i) => /tutorial|cara|how|tips/i.test(i.text || i.caption || '')).length,
    review: items.filter((i) => /review|test|unbox/i.test(i.text || i.caption || '')).length,
    viral: items.filter((i) => /viral|fyp|trending/i.test(i.text || i.caption || '')).length,
  };

  // Generate AI insights via DeepSeek
  let insights = '';
  try {
    const topItems = items
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 5);
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Kamu adalah Competitive Intelligence Analyst. Berikan analisis singkat 3-5 poin.' },
          {
            role: 'user',
            content: `Analisis strategi konten kompetitor "${competitor.name}" di ${competitor.platform}.

Top 5 konten (berdasarkan views):
${topItems.map((i) => `- ${i.playCount || 0} views | ${(i.text || i.caption || '').slice(0, 80)}`).join('\n')}

Top hashtags: ${topHashtags.slice(0, 5).map((h) => h.tag).join(', ')}

Format konten: tutorial=${formats.tutorial}, review=${formats.review}, viral=${formats.viral}

Rata-rata views: ${avgViews.toLocaleString()} | Engagement: ${avgEngagement}%

Berikan:
1. Pola konten yang bikin mereka sukses
2. Jenis hook yang mereka pakai
3. Frekuensi posting optimal (dari data)
4. Kelemahan yang bisa dieksploitasi
5. Rekomendasi strategi untuk menyaingi

Bahasa Indonesia, singkat.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    insights = response.data.choices[0].message.content;
  } catch (err) {
    insights = 'AI insight generation failed.';
  }

  // Save analysis
  const analysis = await prisma.competitorAnalysis.create({
    data: {
      competitorId,
      totalPosts,
      avgViews,
      avgEngagement: parseFloat(avgEngagement),
      topHashtags,
      topFormats: formats,
      insights,
    },
  });

  return { competitor, analysis, topHashtags, formats };
}

module.exports = { addCompetitor, listCompetitors, analyzeCompetitor };
