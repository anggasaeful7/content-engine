/**
 * DeepSeek AI script writer.
 * Generates short-form video scripts from scraped content data.
 */

const axios = require('axios');
const aiConfig = require('../../config').ai;

/**
 * Generate video scripts from scraped raw data.
 * @param {Array} rawData - [{ views, likes, caption, url, platform }]
 * @param {Object} style - { tone, language, persona }
 * @returns {Array} [{ title, content }]
 */
async function generate(rawData, style = {}) {
  const tone = style.tone || 'casual';
  const persona = style.persona || 'gue/lo';

  const prompt = buildPrompt(rawData, tone, persona);

  const response = await axios.post(
    aiConfig.apiUrl,
    {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: 'Anda adalah pakar strategi konten media sosial dan copywriter.' },
        { role: 'user', content: prompt },
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const rawOutput = response.data.choices[0].message.content;
  return parseScripts(rawOutput);
}

function buildPrompt(rawData, tone, persona) {
  const pronouns = persona === 'gue/lo' ? 'gue/lo' : 'saya/anda';
  const toneInstruction =
    tone === 'casual'
      ? `Santai, to-the-point, pake ${pronouns}. Kayak ngomong ke temen. Bold, energetic, gak kaku.`
      : tone === 'professional'
        ? 'Profesional, formal (saya/anda). Berbobot dengan data konkret. Nada konsultan.'
        : 'Edukatif, sabar, jelasin step-by-step. Cocok buat pemula yang baru kenal AI.';

  // Extract top captions as inspiration (max 5 for token efficiency)
  const topCaptions = rawData
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map((item) => `\n- [${item.views?.toLocaleString() || 0} views] ${(item.caption || '').slice(0, 100)}`)
    .join('');

  return `Kamu adalah Top Tech & AI Content Creator untuk platform short-form (TikTok/Reels/Shorts).

## Data Video Viral (Referensi)
Video trending di niche Tech Hacks, AI Tools, Produktivitas Digital:${topCaptions}

## Tugas
Buat 5 naskah video 30-45 detik yang SIAP DIREKAM. Setiap naskah HARUS berdiri sendiri (bisa dipakai terpisah).

## Tema Wajib (Pilih dan variasikan)
- Prompt rahasia Claude/Gemini/ChatGPT untuk ngerjain tugas kampus/kantor lebih cepet.
- Website AI GRATIS yang jarang orang tau (pengganti tools berbayar).
- Otomatisasi no-code simpel (Zapier, Make, Notion AI) buat pemula.
- Trik produktivitas pake AI yang hasilnya langsung kerasa.

## Larangan Keras
- JANGAN sebut Python, PHP, JavaScript, React, Next.js, atau bahasa coding apapun.
- JANGAN pake istilah teknis berat (API, endpoint, deployment, server).
- JANGAN bikin naskah yang butuh skill teknis untuk ngikutin.

## Format WAJIB per Naskah

**[Judul Ide N] Judul yang clickable & bikin penasaran**

**Hook:** (1 kalimat, 3 detik pertama. Negative Hook atau Curiosity Gap. Contoh:
  "Berhenti bikin presentasi manual, AI ini bisa bikin 10 slide dalam 10 detik."
  "Lo tau gak? 90% orang pake ChatGPT dengan cara yang salah.")

**Visual/Layar PC:** (Deskripsikan LANGKAH DEMI LANGKAH apa yang direkam:
  - Website/app apa yang dibuka
  - Apa yang diketik/diklik
  - Apa yang muncul di layar)

**Voiceover:** (Naskah yang DIUCAPKAN. ${toneInstruction}
  Struktur: Hook pembuka → Tutorial singkat → Hasil/Wow moment → CTA)

**Call to Action:** (1 kalimat. Variasikan: save, follow, comment, share, coba sendiri)

## Aturan Tambahan
1. Setiap naskah harus nyebutin NAMA spesifik tools/websitenya (misal: Gamma.app, Claude, ElevenLabs).
2. Voiceover harus enak dibaca lisan — pake kalimat pendek, hindari anak kalimat panjang.
3. Durasi voiceover target: 75-120 kata (sekitar 30-45 detik ngomong).
4. Jangan ulang tema yang sama antar naskah.
5. Setiap CTA harus beda (jangan semua "follow").

Outputkan 5 naskah dengan format persis di atas. JANGAN tambahin intro atau penutup.`;
}

/**
 * Parse raw AI output into structured scripts.
 */
function parseScripts(raw) {
  const scripts = [];

  // Split by various heading formats:
  //   **[Judul Ide 1] Title**
  //   ### [Judul Ide 1] Title
  //   [Judul Ide 1] Title
  const sections = raw.split(/^\*{0,2}#{0,3}\s*\[?Judul Ide\s*\d*\]?:?\s*\*{0,2}\s*/im);

  // If no sections found, try alternative split on markdown H3
  if (sections.length <= 1) {
    const altSections = raw.split(/^#{1,3}\s+(?!.*Judul)/im);
    if (altSections.length > 1) {
      for (const section of altSections) {
        const trimmed = section.trim();
        if (!trimmed) continue;
        const lines = trimmed.split('\n');
        const title = lines[0].replace(/^[\s*#-]+|[\s*#-]+$/g, '').trim();
        scripts.push({ title: title || 'Script', content: trimmed });
      }
      if (scripts.length > 0) return scripts.slice(0, 5);
    }
  }

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Skip intro/preface sections that aren't actual scripts
    // Real scripts have bold section markers like **Hook:** or **Visual**
    if (!trimmed.match(/\*\*Hook:\*\*/i) && !trimmed.match(/\*\*Visual/i) && !trimmed.match(/\*\*Voiceover:\*\*/i)) {
      // Check for plain Hook:/Visual/Voiceover: without bold
      if (!trimmed.match(/^Hook:/im) && !trimmed.match(/^Visual/i) && !trimmed.match(/^Voiceover:/im)) {
        continue;
      }
    }

    const lines = trimmed.split('\n');
    let title = lines[0]
      .replace(/^[\s*#\-\[]+|[\s*#\-\]]+$/g, '')
      .replace(/^\d+[:.]\s*/, '')
      .trim();

    scripts.push({
      title: title || 'Script',
      content: trimmed,
    });
  }

  // If parsing failed, return raw as a single script
  if (scripts.length === 0) {
    scripts.push({ title: 'Generated Scripts', content: raw });
  }

  return scripts.slice(0, 5); // Max 5 scripts
}

module.exports = { generate };
