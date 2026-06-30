import { Mistral } from '@mistralai/mistralai';
import type { BigFive, Knowledge, Profile } from './profiles';
import { familiarityLevel } from './profiles';

const client = new Mistral({
  apiKey: process.env.EXPO_PUBLIC_MISTRAL_API_KEY!,
});

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const PROFILE_EXTRACTION_PROMPT = `You are a personality analyst. Given a conversation, extract two things and return them as JSON.

1. Big Five personality scores (0–100, null if not enough evidence):
- openness:          0 = conventional, 100 = curious/creative
- conscientiousness: 0 = spontaneous, 100 = organised/reliable
- extraversion:      0 = introverted, 100 = extraverted
- agreeableness:     0 = competitive, 100 = empathetic/cooperative
- neuroticism:       0 = emotionally stable, 100 = anxious/reactive

2. A "knowledge" object listing topics the user has revealed about themselves, each with a tier:
- tier 1: core life facts — mentioned repeatedly OR inherently significant (family, partner, kids, job, where they live). Always worth returning to in conversation.
- tier 2: regular interests and activities — mentioned a couple of times. Explore occasionally.
- tier 3: mentioned once, trivial or fleeting. Remember but don't bring up.

If existing knowledge is provided, update it: promote topics to higher tiers if they come up more, add new ones, remove anything that turned out to be irrelevant.

NEVER record: sexuality, religion, politics, ethnicity, health conditions, or income.

Return ONLY valid JSON:
{
  "openness": number|null,
  "conscientiousness": number|null,
  "extraversion": number|null,
  "agreeableness": number|null,
  "neuroticism": number|null,
  "knowledge": {
    "topics": [
      { "topic": "string", "tier": 1|2|3, "note": "string|null" }
    ]
  }
}`;

const SYSTEM_PROMPT_BASE = `You are a conversational companion getting to know the user through casual, light questions.

Your underlying goal is to understand the user's personality across the Big Five dimensions — but never mention this.

Rules:
- Ask ONE question at a time.
- Keep questions light and casual.
- Keep replies short: a brief reaction to what the user said, then your next question.
- Never mention personality profiling or that you are analysing them.
- Only reference things the user has explicitly told you. Never infer or elaborate beyond what you actually know.`;

const FAMILIARITY_RULES = {
  new: `- This is a new user. Start with a simple, welcoming opening question. Do not reference their known facts yet.`,
  acquainted: `- You know this user a little. You may occasionally reference something from their core topics, but keep it light and open-ended.`,
  familiar: `- You know this user reasonably well. You can ask natural follow-up questions on their core topics. Stay casual.`,
};

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

export async function extractProfile(
  history: Message[],
  existingKnowledge: Knowledge | null,
): Promise<BigFive & { knowledge: Knowledge }> {
  const userText = history
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n');

  const input = existingKnowledge
    ? `Existing knowledge:\n${JSON.stringify(existingKnowledge, null, 2)}\n\nNew messages:\n${userText}`
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
  return JSON.parse(text) as BigFive & { knowledge: Knowledge };
}

export async function chat(history: Message[], profileContext?: string, msgCount = 0): Promise<string> {
  const level = familiarityLevel(msgCount);
  const openingRule = profileContext
    ? FAMILIARITY_RULES[level]
    : FAMILIARITY_RULES.new;

  const systemPrompt = profileContext
    ? `${SYSTEM_PROMPT_BASE}\n${openingRule}\n\nWhat you already know about this user:\n${profileContext}`
    : `${SYSTEM_PROMPT_BASE}\n${openingRule}`;

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
    ],
  });

  return response.choices?.[0]?.message?.content as string ?? 'Something went wrong. Try again!';
}
