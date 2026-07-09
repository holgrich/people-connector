import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchNextQuestion, markAnswered, type Question } from '../lib/questions';
import { transcribeAudio } from '../lib/mistral';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

type Props = {
  onChatAboutThis: (question: Question) => void;
};

export default function QuestionCardScreen({ onChatAboutThis }: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    loadNext();
  }, []);

  async function loadNext() {
    setLoading(true);
    setInput('');
    const q = await fetchNextQuestion();
    setQuestion(q);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!input.trim() || !question) return;
    setSubmitting(true);
    await markAnswered(question, input.trim());
    setSubmitting(false);
    loadNext();
  }

  async function handleMicPress() {
    if (isRecording) {
      try {
        setTranscribing(true);
        const uri = await stopRecording();
        if (uri) {
          const text = await transcribeAudio(uri);
          if (text) setInput(text);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Transcription failed.');
      } finally {
        setTranscribing(false);
      }
    } else {
      try {
        await startRecording();
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Could not start recording.');
      }
    }
  }

  const isbusy = submitting || transcribing;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneTitle}>You've answered everything!</Text>
        <Text style={styles.doneSub}>Check back later for new questions.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Question card */}
      <View style={styles.cardArea}>
        <Text style={styles.category}>{question.category.replace(/-/g, ' ')}</Text>
        <Text style={styles.questionText}>{question.text}</Text>
        <TouchableOpacity onPress={() => onChatAboutThis(question)}>
          <Text style={styles.chatLink}>Chat about this →</Text>
        </TouchableOpacity>
      </View>

      {/* Answer input */}
      <View style={styles.inputArea}>
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
            placeholder={isRecording ? 'Recording…' : transcribing ? 'Transcribing…' : 'Your answer…'}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            editable={!isbusy && !isRecording}
            multiline
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skipButton} onPress={loadNext} disabled={isbusy}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isbusy) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!input.trim() || isbusy}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendText}>Answer</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  doneSub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#bbb',
  },
  questionText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    lineHeight: 34,
  },
  chatLink: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  inputArea: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
  },
  sendButton: {
    flex: 2,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
