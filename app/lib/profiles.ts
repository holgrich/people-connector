import { supabase } from './supabase';

export type BigFive = {
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
};

export async function saveProfile(scores: BigFive, messageCount: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Only include traits that Mistral was confident enough to score
  const updates: Record<string, unknown> = {
    id: user.id,
    message_count: messageCount,
    updated_at: new Date().toISOString(),
  };
  if (scores.openness !== null)          updates.openness = scores.openness;
  if (scores.conscientiousness !== null) updates.conscientiousness = scores.conscientiousness;
  if (scores.extraversion !== null)      updates.extraversion = scores.extraversion;
  if (scores.agreeableness !== null)     updates.agreeableness = scores.agreeableness;
  if (scores.neuroticism !== null)       updates.neuroticism = scores.neuroticism;

  await supabase.from('profiles').upsert(updates);
}

export async function loadProfile(): Promise<BigFive | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('openness, conscientiousness, extraversion, agreeableness, neuroticism')
    .single();

  if (error || !data) return null;
  return data as BigFive;
}
