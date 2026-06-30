import { supabase } from './supabase';

export type BigFive = {
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
  notes: string | null;
};

export async function saveProfile(scores: BigFive, messageCount: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

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
  if (scores.notes !== null)             updates.notes = scores.notes;

  await supabase.from('profiles').upsert(updates);
}

export async function loadProfile(): Promise<BigFive | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('openness, conscientiousness, extraversion, agreeableness, neuroticism, notes')
    .single();

  if (error || !data) return null;
  return data as BigFive;
}

export function buildProfileContext(profile: BigFive): string {
  const traits: string[] = [];
  if (profile.openness !== null)          traits.push(`openness ${profile.openness}/100`);
  if (profile.conscientiousness !== null) traits.push(`conscientiousness ${profile.conscientiousness}/100`);
  if (profile.extraversion !== null)      traits.push(`extraversion ${profile.extraversion}/100`);
  if (profile.agreeableness !== null)     traits.push(`agreeableness ${profile.agreeableness}/100`);
  if (profile.neuroticism !== null)       traits.push(`neuroticism ${profile.neuroticism}/100`);

  const lines: string[] = [];
  if (traits.length > 0) lines.push(`Big Five: ${traits.join(', ')}`);
  if (profile.notes)     lines.push(`Known facts: ${profile.notes}`);
  return lines.join('\n');
}
