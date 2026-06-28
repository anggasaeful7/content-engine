const { initRedis } = require('../queue');
const { connection, Worker } = initRedis();
const prisma = require('../db');
const axios = require('axios');

async function generateIdeas(job) {
  const { sourceId, items } = job.data;
  console.log(`💡 Generate ideas: source #${sourceId} (${items.length} items)`);

  try {
    const topItems = items
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);

    const prompt = `Kamu adalah Content Strategist AI. Analisis data trending ini dan berikan 10-15 ide konten.

Data video trending:
${JSON.stringify(topItems.map(i => ({ views: i.views, caption: (i.caption || '').slice(0, 120) })), null, 2)}

Untuk SETIAP ide, berikan format JSON array:
[
  {
    "title": "Judul konten yang clickable",
    "content_type": "short/long",
    "target_platform": "tiktok/instagram/youtube",
    "hook": "Hook 1 kalimat",
    "reasoning": "Kenapa ide ini dipilih berdasarkan data trending (hubungkan dengan views/engagement)",
    "quality_score": 0-100
  }
]

Rules:
- Mix short-form (30-60 detik) dan long-form (8-15 menit)
- Tema: AI tools, produktivitas, website gratis, trik ChatGPT/Claude
- JANGAN sebut coding/Python/framework
- Reasoning harus spesifik refer ke data yang diberikan
- Quality score berdasarkan potensi viralitas

Output: HANYA JSON array, tanpa markdown, tanpa intro.`;

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Kamu adalah Content Strategist. Output HANYA JSON valid.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
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
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Save to DB
    for (const idea of ideas.slice(0, 15)) {
      await prisma.contentIdea.create({
        data: {
          sourceId,
          title: idea.title,
          contentType: idea.content_type || 'short',
          targetPlatform: idea.target_platform || 'tiktok',
          hook: idea.hook,
          deepseekReasoning: idea.reasoning,
          referenceData: topItems.slice(0, 3),
          qualityScore: idea.quality_score || 70,
          seoKeywords: [],
        },
      });
    }

    console.log(`✅ Generated ${ideas.length} ideas for source #${sourceId}`);
  } catch (err) {
    console.error(`❌ Generate ideas failed: ${err.message}`);
  }
}

const worker = new Worker('generate-ideas', generateIdeas, { connection, concurrency: 1 });
console.log('👷 Ideas worker ready');
