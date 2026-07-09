import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { Question } from './lib/questions';
import AuthScreen from './screens/AuthScreen';
import QuestionCardScreen from './screens/QuestionCardScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';

type Tab = 'questions' | 'profile';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('questions');
  const [chatQuestion, setChatQuestion] = useState<Question | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!session) return <AuthScreen />;

  // Chat mode: opened via "Chat about this" on a question card
  if (chatQuestion) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setChatQuestion(null)}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{chatQuestion.text}</Text>
        </View>
        <ChatScreen initialPrompt={chatQuestion.text} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>People Connector</Text>
          <Text style={styles.email}>{session.user.email}</Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.action}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {tab === 'questions'
          ? <QuestionCardScreen onChatAboutThis={(q) => setChatQuestion(q)} />
          : <ProfileScreen />
        }
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('questions')}>
          <Text style={[styles.tabLabel, tab === 'questions' && styles.tabActive]}>Questions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('profile')}>
          <Text style={[styles.tabLabel, tab === 'profile' && styles.tabActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 52,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  email: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  back: {
    fontSize: 15,
    color: '#000',
    marginRight: 12,
  },
  action: {
    color: '#999',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    color: '#bbb',
    fontWeight: '500',
  },
  tabActive: {
    color: '#000',
    fontWeight: '700',
  },
  muted: {
    color: '#999',
  },
});
