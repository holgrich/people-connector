import { supabase } from './supabase';

export type BigFive = {
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
};

export type KnowledgeTopic = {
  topic: string;
  tier: 1 | 2 | 3;
  note: string | null;
};

export type Knowledge = {
  topics: KnowledgeTopic[];
};

export type Profile = BigFive & {
  knowledge: Knowledge | null;
  message_count: number;
};

export async function saveProfile(scores: BigFive, knowledge: Knowledge, messageCount: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updates: Record<string, unknown> = {
    id: user.id,
    message_count: messageCount,
    updated_at: new Date().toISOString(),
    knowledge,
  };
  if (scores.openness !== null)          updates.openness = scores.openness;
  if (scores.conscientiousness !== null) updates.conscientiousness = scores.conscientiousness;
  if (scores.extraversion !== null)      updates.extraversion = scores.extraversion;
  if (scores.agreeableness !== null)     updates.agreeableness = scores.agreeableness;
  if (scores.neuroticism !== null)       updates.neuroticism = scores.neuroticism;

  await supabase.from('profiles').upsert(updates);
}

export async function loadProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('openness, conscientiousness, extraversion, agreeableness, neuroticism, knowledge, message_count')
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export function familiarityLevel(messageCount: number): 'new' | 'acquainted' | 'familiar' {
  if (messageCount < 15) return 'new';
  if (messageCount < 50) return 'acquainted';
  return 'familiar';
}

export function buildProfileContext(profile: Profile): string {
  const lines: string[] = [];

  const traits: string[] = [];
  if (profile.openness !== null)          traits.push(`openness ${profile.openness}/100`);
  if (profile.conscientiousness !== null) traits.push(`conscientiousness ${profile.conscientiousness}/100`);
  if (profile.extraversion !== null)      traits.push(`extraversion ${profile.extraversion}/100`);
  if (profile.agreeableness !== null)     traits.push(`agreeableness ${profile.agreeableness}/100`);
  if (profile.neuroticism !== null)       traits.push(`neuroticism ${profile.neuroticism}/100`);
  if (traits.length > 0) lines.push(`Big Five: ${traits.join(', ')}`);

  const topics = profile.knowledge?.topics ?? [];
  const tier1 = topics.filter((t) => t.tier === 1).map((t) => t.note ? `${t.topic} (${t.note})` : t.topic);
  const tier2 = topics.filter((t) => t.tier === 2).map((t) => t.topic);
  // tier 3 is intentionally omitted — too trivial to surface to the AI

  if (tier1.length > 0) lines.push(`Core topics (important — return to these): ${tier1.join(', ')}`);
  if (tier2.length > 0) lines.push(`Secondary interests (mention occasionally): ${tier2.join(', ')}`);

  return lines.join('\n');
}
