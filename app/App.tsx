import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      if (error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('Connected to Supabase ✓');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>People Connector</Text>
      <Text style={styles.status}>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
});
