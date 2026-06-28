/**
 * Content Engine — cross-platform content adaptation.
 * Implements concepts from skills/content-engine/SKILL.md
 *
 * Takes TikTok-style scripts and adapts them for:
 *   X (Twitter), LinkedIn, YouTube, Instagram, Newsletter
 */

/**
 * Platform-specific content specs.
 */
const PLATFORM_SPECS = {
  tiktok: {
    maxLength: 2200,       // max caption chars
    hashtagLimit: 5,
    optimalDuration: '30-45 detik',
    hooks: 'first-3-seconds',
    style: 'visual-first',
  },
  instagram: {
    maxLength: 2200,
    hashtagLimit: 30,
    optimalDuration: '30-90 detik (Reels)',
    hooks: 'curiosity-gap',
    style: 'visual-first',
  },
  youtube: {
    maxLength: 5000,       // description
    hashtagLimit: 3,
    optimalDuration: '8-15 menit',
    hooks: 'show-results-early',
    style: 'chapter-based',
  },
  x: {
    maxLength: 280,        // per tweet
    hashtagLimit: 0,
    optimalDuration: 'thread',
    hooks: 'fast-opening',
    style: 'one-idea-per-tweet',
  },
  linkedin: {
    maxLength: 3000,
    hashtagLimit: 3,
    optimalDuration: 'short-paragraphs',
    hooks: 'strong-first-line',
    style: 'lessons-results-takeaways',
  },
  newsletter: {
    maxLength: Infinity,
    hashtagLimit: 0,
    optimalDuration: 'scannable-sections',
    hooks: 'clear-pov',
    style: 'strong-opening-paragraph',
  },
};

/**
 * Extract atomic ideas from a script.
 */
function extractIdeas(scriptContent) {
  const ideas = [];
  const lines = scriptContent.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headers and formatting
    if (trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('*')) continue;
    if (trimmed.startsWith('Hook:') || trimmed.startsWith('Visual') || trimmed.startsWith('Voiceover:')) {
      ideas.push(trimmed);
    } else if (trimmed.length > 20 && trimmed.length < 200) {
      ideas.push(trimmed);
    }
  }

  return ideas.slice(0, 7); // max 7 atomic ideas
}

/**
 * Adapt a TikTok script for X (Twitter) thread format.
 */
function adaptForX(script) {
  const ideas = extractIdeas(script.content);
  const hook = ideas.find((i) => i.startsWith('Hook:')) || ideas[0] || '';

  const tweets = [];
  // Tweet 1: Hook
  tweets.push(hook.replace(/^Hook:\s*/, '').slice(0, 240) + ' 🧵');

  // Tweets 2-N: One idea each
  for (let i = 1; i < Math.min(ideas.length, 6); i++) {
    const text = ideas[i]
      .replace(/^Visual\/Layar PC:\s*/, '💻 ')
      .replace(/^Voiceover:\s*/, '')
      .slice(0, 270);
    tweets.push(text);
  }

  // Last tweet: CTA
  tweets.push('Follow for more AI & productivity tips 🔔');

  return {
    platform: 'x',
    format: 'thread',
    content: tweets.join('\n\n'),
    tweets,
  };
}

/**
 * Adapt a TikTok script for LinkedIn.
 */
function adaptForLinkedIn(script) {
  const ideas = extractIdeas(script.content);
  const hook = ideas.find((i) => i.startsWith('Hook:')) || '';

  const body = ideas
    .filter((i) => !i.startsWith('Hook:'))
    .map((i) => i.replace(/^Voiceover:\s*/, '').replace(/^Visual\/Layar PC:\s*/, '→ '))
    .join('\n\n');

  return {
    platform: 'linkedin',
    format: 'post',
    content: `${hook.replace(/^Hook:\s*/, '')}\n\n${body}\n\n—\nFollow for more AI & productivity insights.`,
  };
}

/**
 * Adapt a TikTok script for YouTube description.
 */
function adaptForYouTube(script) {
  const title = script.title || 'AI Tools Tutorial';
  const ideas = extractIdeas(script.content);

  const description = [
    `# ${title}`,
    '',
    '## 📌 Chapters',
    '0:00 - Intro',
    ...ideas.slice(0, 5).map((idea, i) => {
      const text = idea.replace(/^(Hook|Voiceover|Visual\/Layar PC):\s*/, '').slice(0, 60);
      return `${i + 1}:00 - ${text}`;
    }),
    '',
    '## 🔗 Links',
    '- Subscribe for more AI & productivity tips',
    '',
    '#AI #Productivity #TechHacks',
  ].join('\n');

  return {
    platform: 'youtube',
    format: 'description',
    content: description,
  };
}

/**
 * Adapt a TikTok script for Instagram caption.
 */
function adaptForInstagram(script) {
  const hook = extractIdeas(script.content).find((i) => i.startsWith('Hook:')) || '';
  const caption = hook.replace(/^Hook:\s*/, '');

  const hashtags = [
    '#AITools', '#Produktivitas', '#TechHacks', '#KontenKreator',
    '#TipsTeknologi', '#AI', '#WebsiteGratis', '#TutorialAI',
  ];

  return {
    platform: 'instagram',
    format: 'caption',
    content: `${caption}\n\n.\n.\n.\n${hashtags.join(' ')}`,
  };
}

/**
 * Adapt a TikTok script for newsletter section.
 */
function adaptForNewsletter(script) {
  const ideas = extractIdeas(script.content);

  return {
    platform: 'newsletter',
    format: 'section',
    content: [
      `### ${script.title}`,
      '',
      ideas.filter((i) => !i.startsWith('Visual')).join('\n\n'),
      '',
      '---',
    ].join('\n'),
  };
}

/**
 * Main adaptation function.
 * Takes scripts and target platforms, returns adapted content.
 */
function adapt(scripts, targetPlatforms = ['x', 'linkedin', 'youtube', 'instagram']) {
  const adapted = {};

  for (const script of scripts) {
    adapted[script.title] = {};

    for (const platform of targetPlatforms) {
      switch (platform) {
        case 'x':
        case 'twitter':
          adapted[script.title].x = adaptForX(script);
          break;
        case 'linkedin':
          adapted[script.title].linkedin = adaptForLinkedIn(script);
          break;
        case 'youtube':
          adapted[script.title].youtube = adaptForYouTube(script);
          break;
        case 'instagram':
          adapted[script.title].instagram = adaptForInstagram(script);
          break;
        case 'newsletter':
          adapted[script.title].newsletter = adaptForNewsletter(script);
          break;
      }
    }
  }

  return adapted;
}

module.exports = {
  adapt,
  adaptForX,
  adaptForLinkedIn,
  adaptForYouTube,
  adaptForInstagram,
  adaptForNewsletter,
  PLATFORM_SPECS,
};
