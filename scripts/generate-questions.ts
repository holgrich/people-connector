/**
 * Generates questions and writes them as a SQL seed file.
 * Run: npx tsx scripts/generate-questions.ts
 * Then: supabase db execute --file supabase/seeds/questions.sql
 */
import { Mistral } from '@mistralai/mistralai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../app/.env') });

const mistral = new Mistral({ apiKey: process.env.EXPO_PUBLIC_MISTRAL_API_KEY! });

const GENERATION_PROMPT = `Generate 60 fun, light questions for a social app. The questions should feel like entertainment — think TikTok, not therapy. Mix of:
- Would you rather (e.g. "Would you rather have a pet elephant or a pet dolphin?")
- Preferences (e.g. "Mountains or beach?")
- Hypotheticals (e.g. "If you could only eat one cuisine forever, what would it be?")
- Light personality reveals (e.g. "Do you make plans or wing it?")

Each question should subtly reveal something about one Big Five dimension without being obvious about it.

Return ONLY a JSON array (not wrapped in an object):
[
  {
    "text": "the question text",
    "category": "would-you-rather" | "preference" | "hypothetical" | "light-personality",
    "big_five_dimension": "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism"
  }
]

Rules:
- Keep questions short (max 15 words)
- Keep them fun and light — no deep or heavy topics
- No questions about politics, religion, health, relationships, or family
- Vary the categories and dimensions evenly`;

async function main() {
  console.log('Generating questions with Mistral...');

  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: GENERATION_PROMPT }],
    responseFormat: { type: 'json_object' },
  });

  const raw = response.choices?.[0]?.message?.content as string;
  const parsed = JSON.parse(raw);
  const questions: { text: string; category: string; big_five_dimension: string }[] =
    Array.isArray(parsed) ? parsed : parsed.questions ?? Object.values(parsed)[0];

  console.log(`Generated ${questions.length} questions. Writing SQL seed...`);

  const escape = (s: string) => s.replace(/'/g, "''");
  const values = questions
    .map((q) => `('${escape(q.text)}', '${q.category}', '${q.big_five_dimension}', true)`)
    .join(',\n  ');

  const sql = `insert into public.questions (text, category, big_five_dimension, approved) values\n  ${values};`;

  const outDir = path.join(__dirname, '../supabase/seeds');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'questions.sql'), sql);

  console.log(`Done — written to supabase/seeds/questions.sql`);
}

main();
