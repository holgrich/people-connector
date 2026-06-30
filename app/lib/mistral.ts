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
