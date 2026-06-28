/**
 * Angscode — Multi-Platform Content Pipeline
 * Scrapes trending content from TikTok, Instagram, YouTube,
 * generates video scripts via DeepSeek AI, and provides analytics.
 *
 * Usage:
 *   node index.js                          # Run all enabled platforms
 *   node index.js --platform tiktok        # Single platform
 *   node index.js --platform tiktok,instagram
 *   node index.js --format json            # Output as JSON
 *   node index.js --analytics-only         # Analytics only (no content gen)
 */

const config = require('./config');
const env = require('./lib/utils/env');
const formatter = require('./lib/utils/formatter');

// Load and validate environment
env.load();

// --- CLI argument parsing ---
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const cli = {
  platforms: parsePlatforms(args),
  format: parseArg(args, '--format', config.output.format),
  analyticsOnly: args.includes('--analytics-only'),
  allPlatforms: args.includes('--all'),
};

function parsePlatforms(argv) {
  const idx = argv.indexOf('--platform');
  if (idx === -1) return null; // all enabled
  const raw = argv[idx + 1];
  if (!raw) {
    console.error('ERROR: --platform requires a value (e.g. tiktok,instagram)');
    process.exit(1);
  }
  return raw.split(',').map((s) => s.trim().toLowerCase());
}

function parseArg(argv, flag, fallback) {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : fallback;
}

function showHelp() {
  console.log(`
Angscode — Multi-Platform Content Pipeline

Usage:
  node index.js [options]

Options:
  --platform <list>     Platforms to run (comma-separated): tiktok,instagram,youtube
  --all                 Run ALL platforms regardless of config enabled status
  --format <type>       Output format: console, markdown, json (default: markdown)
  --analytics-only      Skip content generation, run analytics only
  --no-adapt            Skip cross-platform content adaptation
  --help, -h            Show this help

Examples:
  node index.js                                    # Run enabled platforms
  node index.js --platform tiktok                  # TikTok only
  node index.js --platform tiktok,instagram        # Multi-platform
  node index.js --all --format json                # All platforms, JSON output
  node index.js --analytics-only                   # Analytics only
`);
}

// --- Platform runner ---
async function scrapePlatform(name, cfg) {
  console.log(`\n🔍 Scraping ${name.toUpperCase()}...`);
  const scraper = require(`./lib/scrapers/${name}`);
  const rawData = await scraper.scrape(cfg);
  console.log(`   Got ${rawData.length} items from ${name}`);
  return rawData;
}

async function generateScripts(rawData) {
  console.log('\n🤖 Generating scripts with DeepSeek...');
  const writer = require('./lib/creators/deepseek-writer');
  return writer.generate(rawData, config.contentCreator);
}

function optimizeScripts(scripts) {
  console.log('\n✨ Optimizing scripts (SEO + brand voice)...');
  const optimizer = require('./lib/creators/content-optimizer');
  return optimizer.optimize(scripts);
}

async function adaptContent(scripts, platforms) {
  console.log('\n🔄 Adapting content for multiple platforms...');
  const adapter = require('./lib/engine/content-adapter');
  return adapter.adapt(scripts, platforms);
}

async function runAnalytics(platform, rawData) {
  console.log('\n📊 Running analytics...');
  const analytics = require('./lib/analytics/apify-analytics');
  return analytics.analyze(platform, rawData);
}

// --- Main pipeline ---
async function main() {
  const platforms = cli.allPlatforms
    ? Object.keys(config.platforms)
    : cli.platforms || Object.keys(config.platforms).filter((p) => config.platforms[p].enabled);

  if (platforms.length === 0) {
    console.log('No platforms enabled. Set `enabled: true` in config.js or use --platform flag.');
    return;
  }

  console.log(`🎯 Platforms: ${platforms.join(', ')}`);
  console.log(`📋 Format: ${cli.format}`);

  for (const platform of platforms) {
    const platformCfg = config.platforms[platform];
    if (!platformCfg) {
      console.error(`Unknown platform: ${platform}`);
      continue;
    }

    try {
      // 1. Scrape
      const rawData = await scrapePlatform(platform, platformCfg);

      if (rawData.length === 0) {
        console.log(`   ⚠ No data found for ${platform}`);
        continue;
      }

      // 2. Generate scripts (skip if analytics-only)
      let scripts = [];
      let adapted = null;
      if (!cli.analyticsOnly) {
        scripts = await generateScripts(rawData);
        scripts = optimizeScripts(scripts);
        if (!args.includes('--no-adapt')) {
          adapted = await adaptContent(scripts, platforms);
        }
      }

      // 3. Analytics
      const analytics = await runAnalytics(platform, rawData);

      // 4. Output
      formatter.output(
        { platform, scripts, rawData, analytics, adapted },
        cli.format,
        config.output.baseDir
      );
    } catch (err) {
      console.error(`   ❌ Error on ${platform}: ${err.message}`);
    }
  }

  console.log('\n✅ Pipeline complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
