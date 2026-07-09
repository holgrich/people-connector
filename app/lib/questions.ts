import { supabase } from './supabase';

export type Question = {
  id: string;
  text: string;
  category: string;
  big_five_dimension: string;
};

export async function fetchNextQuestion(): Promise<Question | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get IDs the user has already answered
  const { data: answered } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', user.id);

  const answeredIds = (answered ?? []).map((r) => r.question_id);

  // Pick a random unanswered approved question
  let query = supabase
    .from('questions')
    .select('id, text, category, big_five_dimension')
    .eq('approved', true);

  if (answeredIds.length > 0) {
    query = query.not('id', 'in', `(${answeredIds.join(',')})`);
  }

  const { data } = await query;
  if (!data || data.length === 0) return null;

  // Pick randomly from the results
  return data[Math.floor(Math.random() * data.length)] as Question;
}

export async function saveAnswer(questionId: string, answer: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_answers').upsert({
    user_id: user.id,
    question_id: questionId,
    answer,
  });
}
