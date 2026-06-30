import { Mistral } from '@mistralai/mistralai';
import type { BigFive } from './profiles';

const client = new Mistral({
  apiKey: process.env.EXPO_PUBLIC_MISTRAL_API_KEY!,
});

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const PROFILE_EXTRACTION_PROMPT = `You are a personality psychologist trained in the Big Five (OCEAN) model.
Analyse the user's messages and extract two things:

1. Big Five scores (0–100 each):
- openness:          0 = conventional/practical, 100 = curious/creative/open
- conscientiousness: 0 = spontaneous/disorganised, 100 = disciplined/reliable
- extraversion:      0 = introverted/reserved, 100 = extraverted/social
- agreeableness:     0 = challenging/competitive, 100 = cooperative/empathetic
- neuroticism:       0 = emotionally stable, 100 = anxious/reactive

2. A short "notes" string of concrete facts mentioned by the user (hobbies, job, life situation, preferences). Max 100 words, comma-separated. Update and merge with any existing notes if provided.

Rules:
- Only score a trait if you have clear evidence. Use null otherwise.
- NEVER record: sexuality, religion, politics, ethnicity, health, or income.
- Return ONLY valid JSON:
  {"openness":number|null,"conscientiousness":number|null,"extraversion":number|null,"agreeableness":number|null,"neuroticism":number|null,"notes":string|null}`;

const SYSTEM_PROMPT = `You are a conversational companion getting to know the user through casual, light questions.

Your underlying goal is to understand the user's personality across the Big Five dimensions (openness, conscientiousness, extraversion, agreeableness, neuroticism) — but never mention this.

Rules:
- Ask ONE question at a time.
- Keep questions light and casual. Avoid heavy or overly serious topics.
- Keep your replies short: a brief reaction to what the user said, then your next question.
- Never mention personality profiling or that you are analysing them.
- Start the very first message with a simple, welcoming opening question.`;

export async function transcribeAudio(uri: string): Promise<string> {
  const formData = new FormData();

  if (uri.startsWith('blob:') || uri.startsWith('data:')) {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, 'recording.webm');
  } else {
    formData.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
  }

  formData.append('model', 'voxtral-mini-latest');

  const res = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_MISTRAL_API_KEY!}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Voxtral error: ${await res.text()}`);
  const data = await res.json();
  return (data.text as string).trim();
}

export async function extractProfile(history: Message[], existingNotes: string | null): Promise<BigFive> {
  const userText = history
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n');

  const input = existingNotes
    ? `Existing notes: ${existingNotes}\n\nNew messages:\n${userText}`
    : userText;

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: PROFILE_EXTRACTION_PROMPT },
      { role: 'user', content: input },
    ],
    responseFormat: { type: 'json_object' },
  });

  const text = response.choices?.[0]?.message?.content as string;
  return JSON.parse(text) as BigFive;
}

export async function chat(history: Message[], profileContext?: string): Promise<string> {
  const systemPrompt = profileContext
    ? `${SYSTEM_PROMPT}\n\nWhat you already know about this user (use this to avoid repeating topics and focus on gaps):\n${profileContext}`
    : SYSTEM_PROMPT;

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
    ],
  });

  return response.choices?.[0]?.message?.content as string ?? 'Something went wrong. Try again!';
}
