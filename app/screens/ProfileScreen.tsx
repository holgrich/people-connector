import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { loadProfile, type BigFive } from '../lib/profiles';

const TRAITS: {
  key: keyof Omit<BigFive, 'notes'>;
  label: string;
  low: string;
  high: string;
}[] = [
  { key: 'openness',          label: 'Openness',          low: 'Conventional',  high: 'Curious & creative' },
  { key: 'conscientiousness', label: 'Conscientiousness', low: 'Spontaneous',   high: 'Organised & reliable' },
  { key: 'extraversion',      label: 'Extraversion',      low: 'Introverted',   high: 'Extraverted' },
  { key: 'agreeableness',     label: 'Agreeableness',     low: 'Competitive',   high: 'Empathetic & cooperative' },
  { key: 'neuroticism',       label: 'Neuroticism',       low: 'Emotionally stable', high: 'Emotionally reactive' },
];

function TraitBar({ label, low, high, score }: { label: string; low: string; high: string; score: number | null }) {
  return (
    <View style={styles.trait}>
      <View style={styles.traitHeader}>
        <Text style={styles.traitLabel}>{label}</Text>
        {score !== null
          ? <Text style={styles.traitScore}>{Math.round(score)}/100</Text>
          : <Text style={styles.traitUnknown}>not enough data yet</Text>
        }
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: score !== null ? `${score}%` : '0%' }, score === null && styles.barEmpty]} />
      </View>
      <View style={styles.traitEndLabels}>
        <Text style={styles.endLabel}>{low}</Text>
        <Text style={styles.endLabel}>{high}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<BigFive | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No profile yet.</Text>
        <Text style={styles.emptySub}>Chat for a bit and your profile will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Big Five personality</Text>
      {TRAITS.map((t) => (
        <TraitBar key={t.key} label={t.label} low={t.low} high={t.high} score={profile[t.key]} />
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>What we know about you</Text>
      {profile.notes
        ? <Text style={styles.notes}>{profile.notes}</Text>
        : <Text style={styles.emptySub}>Nothing noted yet — keep chatting.</Text>
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  empty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  trait: {
    marginBottom: 20,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  traitLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  traitScore: {
    fontSize: 13,
    color: '#555',
  },
  traitUnknown: {
    fontSize: 12,
    color: '#bbb',
    fontStyle: 'italic',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 4,
  },
  barEmpty: {
    backgroundColor: 'transparent',
  },
  traitEndLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  endLabel: {
    fontSize: 11,
    color: '#bbb',
  },
  notes: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});
