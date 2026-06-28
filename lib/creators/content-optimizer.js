/**
 * Content Creator integration — SEO optimization & brand voice analysis.
 * Implements concepts from skills/content-creator/SKILL.md
 */

const contentCreatorConfig = require('../../config').contentCreator;

/**
 * Brand voice profile: target attributes for consistent content.
 */
const BRAND_VOICE = {
  primaryArchetype: 'sage',       // The Sage — wisdom, knowledge
  secondaryArchetype: 'jester',   // The Jester — humor, relatability
  attributes: ['casual', 'direct', 'actionable', 'tech-savvy'],
  readabilityTarget: 'grade-8',   // Easy to understand
  formalityLevel: 2,              // 1-10, 1=very casual
};

/**
 * SEO keywords relevant to the niche.
 */
const SEED_KEYWORDS = [
  'AI tools', 'website AI gratis', 'trik ChatGPT', 'produktivitas',
  'otomatisasi kerja', 'no-code', 'AI agent', 'tutorial AI',
  'tips teknologi', 'aplikasi AI',
];

/**
 * Analyze brand voice consistency of a script.
 * Returns score 0-100 and recommendations.
 */
function analyzeVoice(scriptContent) {
  const issues = [];
  let score = 100;

  // Check for jargon / banned terms
  const bannedTerms = ['Python', 'PHP', 'Next.js', 'React', 'Django', 'Laravel', 'framework', 'coding', 'programming'];
  for (const term of bannedTerms) {
    if (scriptContent.toLowerCase().includes(term.toLowerCase())) {
      issues.push(`Contains banned term: "${term}"`);
      score -= 15;
    }
  }

  // Check for CTA presence
  if (!scriptContent.toLowerCase().includes('follow') && !scriptContent.toLowerCase().includes('save')) {
    issues.push('Missing Call to Action (follow/save)');
    score -= 10;
  }

  // Check length (30-45 seconds = roughly 75-120 words for voiceover)
  const wordCount = scriptContent.split(/\s+/).length;
  if (wordCount < 50) {
    issues.push(`Too short: ${wordCount} words (target 75-120)`);
    score -= 5;
  } else if (wordCount > 150) {
    issues.push(`Too long: ${wordCount} words (target 75-120)`);
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    wordCount,
    issues,
    archetype: BRAND_VOICE.primaryArchetype,
    attributes: BRAND_VOICE.attributes,
  };
}

/**
 * Generate SEO keywords for a script topic.
 */
function suggestKeywords(scriptTitle) {
  const titleLower = scriptTitle.toLowerCase();
  const matched = SEED_KEYWORDS.filter((kw) => titleLower.includes(kw.toLowerCase()));

  return {
    primary: matched[0] || SEED_KEYWORDS[0],
    secondary: matched.slice(1, 3),
    lsi: SEED_KEYWORDS.filter((kw) => !matched.includes(kw)).slice(0, 5),
    hashtagSuggestions: matched.map((kw) => '#' + kw.replace(/\s+/g, '').toLowerCase()),
  };
}

/**
 * Calculate a content quality score.
 */
function qualityScore(script, voiceAnalysis, keywords) {
  let score = 70; // base

  score += Math.floor(voiceAnalysis.score * 0.2);
  score += Math.min(keywords.secondary.length * 5, 15);

  return Math.min(100, score);
}

/**
 * Optimize all scripts: analyze voice, suggest SEO, score quality.
 * @param {Array} scripts - [{ title, content }]
 * @returns {Array} scripts with added metadata
 */
function optimize(scripts) {
  return scripts.map((script) => {
    const voice = analyzeVoice(script.content);
    const keywords = suggestKeywords(script.title);
    const score = qualityScore(script, voice, keywords);

    return {
      ...script,
      voiceAnalysis: voice,
      seoKeywords: keywords,
      qualityScore: score,
    };
  });
}

module.exports = {
  optimize,
  analyzeVoice,
  suggestKeywords,
  qualityScore,
  BRAND_VOICE,
  SEED_KEYWORDS,
};
