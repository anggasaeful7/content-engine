/**
 * Centralized configuration for Angscode multi-platform content pipeline.
 */

module.exports = {
  // Scraping targets
  hashtags: [
    'aitools',
    'websiteberguna',
    'chatgpthacks',
    'productivityhacks',
    'rahasiawebsite',
    'tipsteknologi',
  ],

  // Platform configurations
  platforms: {
    tiktok: {
      enabled: true,
      actorId: 'clockworks/tiktok-scraper',
      resultsPerPage: 5,
    },
    instagram: {
      enabled: false,
      actorId: 'apify/instagram-scraper',
      resultsPerPage: 10,
      scraperType: 'hashtag',
      searchLimit: 3,
    },
    youtube: {
      enabled: false,
      actorId: 'api-ninja/youtube-search-scraper',
      resultsPerPage: 10,
      local: false,
      scrapeAllResults: false,
    },
  },

  // AI / DeepSeek settings
  ai: {
    model: 'deepseek-chat',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    temperature: 0.7,
    maxTokens: 2000,
  },

  // Content creator settings
  contentCreator: {
    tone: 'casual',        // casual | professional | educational
    language: 'id',        // id | en
    persona: 'gue/lo',     // gue/lo | saya/anda | neutral
  },

  // Output settings
  output: {
    baseDir: './output',
    format: 'markdown',    // markdown | json | console
    saveRawData: true,
  },

  // Apify settings
  apify: {
    timeout: 600,           // seconds
    pollInterval: 5,        // seconds
  },
};
