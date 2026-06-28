/**
 * Output formatter for console, markdown, and JSON.
 */

const fs = require('fs');
const path = require('path');

/**
 * Format and output content based on format type.
 * @param {Object} data - { platform, scripts, rawData, analytics }
 * @param {string} format - 'console' | 'markdown' | 'json'
 * @param {string} outputDir - base output directory
 */
function output(data, format, outputDir) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const dir = path.join(outputDir, dateStr);
  fs.mkdirSync(dir, { recursive: true });

  switch (format) {
    case 'markdown':
      return saveMarkdown(data, dir);
    case 'json':
      return saveJSON(data, dir);
    case 'console':
    default:
      return printConsole(data);
  }
}

function printConsole(data) {
  console.log('\n================ HASIL ANALISIS ================\n');
  console.log(`Platform: ${data.platform}`);
  console.log(`Total konten: ${data.rawData.length}\n`);

  if (data.scripts && data.scripts.length > 0) {
    data.scripts.forEach((script, i) => {
      console.log(`### Script ${i + 1}: ${script.title || 'Tanpa Judul'}`);
      console.log(script.content || script);
      console.log('---\n');
    });
  }

  if (data.analytics) {
    console.log('\n### Analytics Summary');
    console.log(data.analytics);
  }
}

function saveMarkdown(data, dir) {
  const lines = [];
  lines.push(`# Hasil Analisis Konten — ${data.platform.toUpperCase()}`);
  lines.push(`> Tanggal: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`> Total konten dianalisis: ${data.rawData.length}\n`);

  if (data.scripts && data.scripts.length > 0) {
    lines.push('## Naskah Video\n');
    data.scripts.forEach((script, i) => {
      lines.push(`### ${i + 1}. ${script.title || 'Script ' + (i + 1)}`);
      lines.push('');
      lines.push(script.content);
      lines.push('');
      if (script.voiceAnalysis) {
        lines.push(`> 🎯 Quality Score: ${script.qualityScore}/100 | Voice: ${script.voiceAnalysis.score}/100`);
        if (script.seoKeywords) {
          lines.push(`> 🔑 Keywords: ${script.seoKeywords.primary} | ${script.seoKeywords.hashtagSuggestions.join(' ')}`);
        }
        lines.push('');
      }
      lines.push('---\n');
    });
  } else {
    lines.push('## Naskah Video\n');
    lines.push('_⚠️ Tidak ada naskah yang berhasil di-parse. Cek format output DeepSeek._\n');
  }

  if (data.analytics) {
    lines.push('## Analytics\n');
    if (typeof data.analytics === 'string') {
      lines.push(data.analytics);
    } else {
      lines.push(JSON.stringify(data.analytics, null, 2));
    }
  }

  const filename = `${data.platform}-${Date.now()}.md`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');
  console.log(`\nOutput saved: ${filepath}`);
  return filepath;
}

function saveJSON(data, dir) {
  const filename = `${data.platform}-${Date.now()}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\nOutput saved: ${filepath}`);
  return filepath;
}

module.exports = { output, printConsole, saveMarkdown, saveJSON };
