import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { chat, extractProfile, transcribeAudio, type Message } from '../lib/mistral';
import { buildProfileContext, loadProfile, saveProfile, type Profile } from '../lib/profiles';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

type UIMessage = Message & { id: string };

type Props = {
  initialPrompt?: string;
};

export default function ChatScreen({ initialPrompt }: Props) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const profileRef = useRef<Profile | null>(null);
  const listRef = useRef<FlatList>(null);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    loadProfile().then((profile) => {
      profileRef.current = profile;
      const context = profile ? buildProfileContext(profile) : undefined;
      if (initialPrompt) {
        // Seed the conversation with the question as the first user message
        const seed: UIMessage[] = [{ id: '0', role: 'user', content: initialPrompt }];
        setMessages(seed);
        sendToAI(seed, context);
      } else {
        sendToAI([], context);
      }
    });
  }, []);

  async function sendToAI(history: Message[], profileContext?: string) {
    setLoading(true);
    try {
      const context = profileContext ?? (profileRef.current ? buildProfileContext(profileRef.current) : undefined);
      const msgCount = profileRef.current?.message_count ?? 0;
      const reply = await chat(history, context, msgCount);
      const aiMessage: UIMessage = { id: Date.now().toString(), role: 'assistant', content: reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Oops, something went wrong. Try again!' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: UIMessage = { id: Date.now().toString(), role: 'user', content };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');

    // Silently update profile every 3 user messages (fire-and-forget)
    const userCount = newHistory.filter((m) => m.role === 'user').length;
    if (userCount > 0 && userCount % 3 === 0) {
      const existingKnowledge = profileRef.current?.knowledge ?? null;
      extractProfile(newHistory, existingKnowledge)
        .then((result) => {
          const { knowledge, ...scores } = result;
          if (profileRef.current) profileRef.current = { ...profileRef.current, ...scores, knowledge };
          return saveProfile(scores, knowledge, userCount);
        })
        .catch(() => {});
    }

    await sendToAI(newHistory);
  }

  async function handleMicPress() {
    if (isRecording) {
      // Stop and transcribe
      try {
        setTranscribing(true);
        const uri = await stopRecording();
        if (!uri) return;
        const text = await transcribeAudio(uri);
        if (text) await handleSend(text);
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Transcription failed.');
      } finally {
        setTranscribing(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Could not start recording.');
      }
    }
  }

  const isbusy = loading || transcribing;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={
          isbusy ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#999" />
              {transcribing && <Text style={styles.transcribingLabel}>Transcribing…</Text>}
            </View>
          ) : null
        }
      />

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={handleMicPress}
          disabled={isbusy}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={isRecording ? 'Recording…' : 'Type your answer…'}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          editable={!isbusy && !isRecording}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isbusy || isRecording) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isbusy || isRecording}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  aiBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#eee',
  },
  userBubble: {
    backgroundColor: '#000',
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111',
  },
  userText: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  transcribingLabel: {
    fontSize: 13,
    color: '#999',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  micIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});
