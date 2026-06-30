import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthScreen from './screens/AuthScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';

type Tab = 'chat' | 'profile';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('chat');
  const [chatKey, setChatKey] = useState(0);

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

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>People Connector</Text>
          <Text style={styles.email}>{session.user.email}</Text>
        </View>
        <View style={styles.headerActions}>
          {tab === 'chat' && (
            <>
              <TouchableOpacity onPress={() => setChatKey((k) => k + 1)}>
                <Text style={styles.action}>New chat</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>·</Text>
            </>
          )}
          <TouchableOpacity onPress={() => supabase.auth.signOut()}>
            <Text style={styles.action}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'chat'
          ? <ChatScreen key={chatKey} />
          : <ProfileScreen />
        }
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => setTab('chat')}>
          <Text style={[styles.tabLabel, tab === 'chat' && styles.tabActive]}>Chat</Text>
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
  },
  email: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  action: {
    color: '#999',
    fontSize: 14,
  },
  separator: {
    color: '#ccc',
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
