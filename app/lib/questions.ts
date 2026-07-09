import { supabase } from './supabase';
import { extractProfileFromAnswer } from './mistral';
import { saveProfile, loadProfile } from './profiles';

export type Question = {
  id: string;
  text: string;
  category: string;
  big_five_dimension: string;
};

export async function fetchNextQuestion(): Promise<Question | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: seen } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', user.id);

  const seenIds = (seen ?? []).map((r) => r.question_id);

  let query = supabase
    .from('questions')
    .select('id, text, category, big_five_dimension')
    .eq('approved', true);

  if (seenIds.length > 0) {
    query = query.not('id', 'in', `(${seenIds.join(',')})`);
  }

  const { data } = await query;
  if (!data || data.length === 0) return null;

  return data[Math.floor(Math.random() * data.length)] as Question;
}

export async function markAnswered(question: Question, answer: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Mark question as seen (no answer stored)
  await supabase.from('user_answers').upsert({
    user_id: user.id,
    question_id: question.id,
  });

  // Extract profile signals from the answer in the background
  loadProfile().then((profile) => {
    const existingKnowledge = profile?.knowledge ?? null;
    const messageCount = (profile?.message_count ?? 0) + 1;
    return extractProfileFromAnswer(question.text, answer, existingKnowledge)
      .then(({ knowledge, ...scores }) => saveProfile(scores, knowledge, messageCount));
  }).catch(() => {});
}
