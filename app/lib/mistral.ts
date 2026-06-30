import { Mistral } from '@mistralai/mistralai';

const client = new Mistral({
  apiKey: process.env.EXPO_PUBLIC_MISTRAL_API_KEY!,
});

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `You are a fun and curious conversational companion. Your job is to ask the user interesting,
varied questions to get to know them — their personality, hobbies, values, opinions, and life.

Rules:
- Ask ONE question at a time. Never ask multiple questions in one message.
- Keep your replies short: one brief, warm reaction to what the user said (max 1-2 sentences), then your next question.
- Be playful and occasionally witty, but never sarcastic or mean.
- Vary the topics: mix light fun questions with deeper ones. Don't stay on one topic too long.
- Never mention that you are building a profile. The user should feel like they're just having a fun chat.
- Start the very first message with a welcoming question to kick things off.`;

export async function transcribeAudio(uri: string): Promise<string> {
  const formData = new FormData();

  if (uri.startsWith('blob:') || uri.startsWith('data:')) {
    // Web: fetch the blob from the blob URL
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, 'recording.webm');
  } else {
    // Native: pass the file URI directly
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

export async function chat(history: Message[]): Promise<string> {
  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
    ],
  });

  return response.choices?.[0]?.message?.content as string ?? 'Something went wrong. Try again!';
}
