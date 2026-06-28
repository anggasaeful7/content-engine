/**
 * Apify Content Analytics integration.
 * Implements concepts from skills/apify-content-analytics-1.0.0/SKILL.md
 *
 * Computes engagement metrics, ranks content, and provides
 * actionable insights from scraped data.
 */

/**
 * Analyze scraped content and compute metrics.
 * @param {string} platform - platform name
 * @param {Array} rawData - [{ views, likes, caption, url, platform }]
 * @returns {Object} analytics report
 */
function analyze(platform, rawData) {
  if (!rawData || rawData.length === 0) {
    return {
      platform,
      totalItems: 0,
      message: 'No data to analyze.',
    };
  }

  // Compute aggregate metrics
  const totalViews = rawData.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalLikes = rawData.reduce((sum, item) => sum + (item.likes || 0), 0);
  const avgViews = Math.round(totalViews / rawData.length);
  const avgLikes = Math.round(totalLikes / rawData.length);
  const engagementRate = totalViews > 0
    ? ((totalLikes / totalViews) * 100).toFixed(2)
    : '0.00';

  // Rank by views
  const ranked = [...rawData]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map((item, i) => ({
      rank: i + 1,
      views: item.views,
      likes: item.likes,
      caption: (item.caption || '').slice(0, 80),
    }));

  // Detect trending topics from captions
  const topics = detectTrendingTopics(rawData.map((item) => item.caption || ''));

  // Recommendations
  const recommendations = generateRecommendations(platform, {
    totalViews,
    avgViews,
    engagementRate,
    topics,
  });

  return {
    platform,
    totalItems: rawData.length,
    totalViews,
    totalLikes,
    avgViews,
    avgLikes,
    engagementRate: `${engagementRate}%`,
    topContent: ranked,
    trendingTopics: topics,
    recommendations,
  };
}

/**
 * Detect trending topics from captions using keyword frequency.
 */
function detectTrendingTopics(captions) {
  const wordFreq = {};
  const stopWords = new Set([
    // Indonesian
    'yang', 'dan', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'adalah',
    'dari', 'ke', 'di', 'akan', 'atau', 'saya', 'kamu', 'kita', 'mereka',
    'tidak', 'bisa', 'ada', 'juga', 'sudah', 'saja', 'tapi', 'kalau',
    'lebih', 'banyak', 'karena', 'cara', 'pakai', 'jadi', 'biar',
    // English common
    'the', 'and', 'for', 'you', 'this', 'that', 'with', 'your', 'can',
    'are', 'was', 'has', 'had', 'not', 'but', 'all', 'its', 'out',
    'one', 'get', 'use', 'like', 'just', 'how', 'what', 'when', 'from',
    'have', 'been', 'will', 'into', 'more', 'some', 'than', 'about',
    'make', 'need', 'see', 'know', 'new', 'way', 'also', 'now', 'here',
    'there', 'their', 'them', 'then', 'very', 'much', 'only', 'our',
    'over', 'back', 'after', 'before', 'between', 'still', 'other',
    'every', 'each', 'both', 'few', 'those', 'these', 'most', 'such',
    'through', 'during', 'using', 'used', 'take', 'want', 'does',
    'really', 'even', 'should', 'could', 'would', 'being', 'been',
    'open', 'tap', 'click', 'link', 'video', 'check', 'watch',
  ]);

  for (const caption of captions) {
    const words = caption.toLowerCase().split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^a-z0-9]/g, '');
      if (clean.length < 3 || stopWords.has(clean)) continue;
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Generate actionable recommendations.
 */
function generateRecommendations(platform, metrics) {
  const recs = [];

  if (metrics.avgViews < 10000) {
    recs.push('Tingkatkan hook di 3 detik pertama untuk meningkatkan views.');
  }

  if (parseFloat(metrics.engagementRate) < 5) {
    recs.push('Engagement rate rendah — coba tambahkan CTA yang lebih kuat (save/follow/comment).');
  }

  if (metrics.topics && metrics.topics.length > 0) {
    recs.push(`Topik trending: ${metrics.topics.slice(0, 3).map((t) => t.word).join(', ')}. Fokuskan konten ke topik ini.`);
  }

  switch (platform) {
    case 'tiktok':
      recs.push('Gunakan 3-5 hashtag trending spesifik niche, bukan hashtag umum seperti #fyp.');
      break;
    case 'instagram':
      recs.push('Posting Reels di jam 7-9 pagi atau 7-9 malam untuk reach optimal.');
      break;
    case 'youtube':
      recs.push('Tambahkan timestamps di deskripsi dan optimalkan thumbnail.');
      break;
  }

  return recs;
}

module.exports = { analyze };
