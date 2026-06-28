const { initRedis } = require('../queue');
const { connection, Worker } = initRedis();
const prisma = require('../db');
const axios = require('axios');

async function produceContent(job) {
  const { ideaId } = job.data;
  console.log(`🎬 Produce content: idea #${ideaId}`);

  try {
    const idea = await prisma.contentIdea.findUnique({
      where: { id: ideaId },
      include: { source: true },
    });

    if (!idea) { console.error(`Idea #${ideaId} not found`); return; }

    // 1. Create content placeholder
    const content = await prisma.content.create({
      data: {
        ideaId: idea.id,
        sourceId: idea.sourceId,
        title: idea.title,
        contentType: idea.contentType,
        targetPlatform: idea.targetPlatform,
        status: 'in_progress',
      },
    });

    // 2. Generate full content with DeepSeek
    const prompt = buildContentPrompt(idea);
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Kamu adalah Content Producer profesional. Output HANYA JSON valid.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const raw = response.data.choices[0].message.content;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const produced = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // 3. Update content with produced assets
    await prisma.content.update({
      where: { id: content.id },
      data: {
        contentDescription: produced.content_description || '',
        script: produced.script || '',
        storyboard: produced.storyboard || [],
        transcript: produced.transcript || '',
        assetDescriptions: produced.asset_descriptions || [],
        hook: produced.hook || idea.hook,
        callToAction: produced.call_to_action || '',
        durationEstimate: produced.duration_estimate || 40,
        hashtags: produced.hashtags || [],
        qualityScore: idea.qualityScore,
        status: 'completed',
      },
    });

    // 4. Content Repurposing Chain — adapt for 5 platforms
    await repurposeContent(content, produced);

    console.log(`✅ Content #${content.id} produced + repurposed`);
  } catch (err) {
    console.error(`❌ Produce content failed: ${err.message}`);
    // Update content status to draft on failure
    const existing = await prisma.content.findFirst({ where: { ideaId }, orderBy: { createdAt: 'desc' } });
    if (existing) {
      await prisma.content.update({ where: { id: existing.id }, data: { status: 'draft' } });
    }
  }
}

function buildContentPrompt(idea) {
  return `Buatkan konten lengkap untuk ide berikut:

Judul: "${idea.title}"
Tipe: ${idea.contentType} (${idea.contentType === 'short' ? '30-60 detik' : '8-15 menit'})
Platform: ${idea.targetPlatform}
Hook: ${idea.hook || 'N/A'}

Outputkan JSON dengan struktur:
{
  "content_description": "Deskripsi konten 2-3 kalimat",
  "script": "Naskah lengkap dengan Hook, Body, Call to Action. Format: Hook: ... Visual: ... Voiceover: ... CTA: ...",
  "storyboard": [
    {"scene": 1, "visual": "Apa yang ditampilkan", "voiceover": "Narasi", "duration": 5}
  ],
  "transcript": "Transkrip bersih tanpa markup (hanya kata yang diucapkan)",
  "asset_descriptions": [
    {"type": "screen_record", "app": "nama app", "action": "step by step apa yang direkam", "notes": "catatan tambahan"}
  ],
  "hook": "Hook 1 kalimat",
  "call_to_action": "CTA 1 kalimat",
  "duration_estimate": 40,
  "hashtags": ["#tag1", "#tag2"]
}

Rules:
- Bahasa Indonesia casual (gue/lo) untuk short-form, semi-formal untuk long-form
- Storyboard minimal 3-5 scene
- Asset descriptions harus detail: app apa, klik apa, ketik apa, tunjukin apa
- JANGAN sebut coding/Python/framework`;
}

const worker = new Worker('produce-content', produceContent, { connection, concurrency: 2 });
console.log('👷 Content worker ready');

// ─── Content Repurposing Chain ───
async function repurposeContent(content, produced) {
  const platforms = ['x', 'linkedin', 'youtube', 'instagram', 'newsletter'];
  const adapter = require('../../lib/engine/content-adapter');

  const script = {
    title: content.title,
    content: produced.script || '',
  };

  const adapted = adapter.adapt([script], platforms);

  for (const [title, platformAdaptations] of Object.entries(adapted)) {
    for (const [platform, adaptation] of Object.entries(platformAdaptations)) {
      await prisma.contentAdaptation.create({
        data: {
          contentId: content.id,
          platform,
          adaptedTitle: adaptation.title || content.title,
          content: adaptation.content,
          format: adaptation.format,
        },
      });
    }
  }

  console.log(`🔄 Repurposed content #${content.id} → ${platforms.length} platforms`);
}
