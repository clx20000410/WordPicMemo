import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { useWordStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { ttsService } from '../../services';

export default function WordDetailScreen({ route }: any) {
  const { wordId } = route.params;
  const { currentWord, fetchWordById, regenerateExplanation, regenerateImage, isLoading } = useWordStore();
  const navigation = useNavigation();

  useEffect(() => {
    fetchWordById(wordId);
  }, [wordId]);

  useEffect(() => {
    // Poll for generation status (both explanation and image)
    const explanationInProgress =
      currentWord?.explanation?.explanationStatus === 'generating' ||
      currentWord?.explanation?.explanationStatus === 'pending';
    const imageInProgress =
      currentWord?.explanation?.imageStatus === 'generating' ||
      currentWord?.explanation?.imageStatus === 'pending';

    if (explanationInProgress || imageInProgress) {
      const timer = setInterval(() => fetchWordById(wordId), 3000);
      return () => clearInterval(timer);
    }
  }, [currentWord?.explanation?.explanationStatus, currentWord?.explanation?.imageStatus, wordId]);

  if (isLoading || !currentWord) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const exp = currentWord.explanation;
  const isGenerating = exp?.explanationStatus === 'generating' || exp?.explanationStatus === 'pending';

  return (
    <ScrollView style={styles.container}>
      {/* 1. Word Header + TTS */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.wordRow}>
            <Text variant="headlineLarge" style={styles.word}>{currentWord.word}</Text>
            <IconButton
              icon="volume-high"
              size={28}
              iconColor="#4A90D9"
              onPress={() => ttsService.speakWord(currentWord.word)}
              style={styles.ttsButton}
            />
          </View>
          {exp?.pronunciation && (
            <Text variant="bodyLarge" style={styles.pronunciation}>{exp.pronunciation}</Text>
          )}
          <Chip compact style={styles.langChip}>{currentWord.language.toUpperCase()}</Chip>
        </Card.Content>
      </Card>

      {isGenerating ? (
        <Card style={styles.card}>
          <Card.Content style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.generatingText}>AI is generating explanation...</Text>
          </Card.Content>
        </Card>
      ) : exp?.explanationStatus === 'completed' ? (
        <>
          {/* 2. Example Sentences (with TTS) */}
          {exp.exampleSentences && exp.exampleSentences.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>Example Sentences</Text>
                {exp.exampleSentences.map((sentence: any, index: number) => (
                  <View key={index} style={styles.example}>
                    <View style={styles.sentenceRow}>
                      <Text variant="bodyMedium" style={styles.sentenceText}>{sentence.en}</Text>
                      <IconButton
                        icon="volume-high"
                        size={20}
                        iconColor="#4A90D9"
                        onPress={() => ttsService.speakWord(sentence.en)}
                        style={styles.sentenceTts}
                      />
                    </View>
                    <View style={styles.sentenceRow}>
                      <Text variant="bodySmall" style={[styles.zhText, styles.sentenceText]}>{sentence.zh}</Text>
                      <IconButton
                        icon="volume-high"
                        size={18}
                        iconColor="#9CA3AF"
                        onPress={() => ttsService.speakChinese(sentence.zh)}
                        style={styles.sentenceTts}
                      />
                    </View>
                    {index < exp.exampleSentences.length - 1 && <Divider style={styles.divider} />}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* 3. Core Definition */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Core Definition</Text>
              <Text variant="bodyLarge">{exp.coreDefinition}</Text>
            </Card.Content>
          </Card>

          {/* 4. Word Breakdown */}
          {exp.wordBreakdown && exp.wordBreakdown.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>Word Breakdown</Text>
                {exp.wordBreakdown.map((item: any, index: number) => (
                  <View key={index} style={styles.breakdownItem}>
                    <Chip compact>{item.part}</Chip>
                    <Text style={styles.breakdownMeaning}>{item.meaning}</Text>
                    {item.origin && <Text style={styles.breakdownOrigin}>({item.origin})</Text>}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* 5. Mnemonic */}
          {exp.mnemonicPhrase && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>Mnemonic</Text>
                <Text variant="bodyLarge" style={styles.mnemonic}>{exp.mnemonicPhrase}</Text>
              </Card.Content>
            </Card>
          )}

          {/* 6. Memory Scene */}
          {exp.memoryScene && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>Memory Scene</Text>
                <Text variant="bodyMedium">{exp.memoryScene}</Text>
              </Card.Content>
            </Card>
          )}

          {/* 7. Memory Image */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Memory Image</Text>
              {exp.imageStatus === 'completed' && exp.imageUrl ? (
                <Image source={{ uri: exp.imageUrl }} style={styles.memoryImage} resizeMode="cover" />
              ) : exp.imageStatus === 'generating' || exp.imageStatus === 'pending' ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator />
                  <Text>Generating image...</Text>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text>Image generation failed</Text>
                  <Button mode="outlined" onPress={() => regenerateImage(currentWord.id)}>
                    Retry
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* 8. Actions */}
          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => regenerateExplanation(currentWord.id)} icon="refresh">
              Regenerate
            </Button>
          </View>
        </>
      ) : (
        <Card style={styles.card}>
          <Card.Content style={styles.centered}>
            <Text variant="titleMedium" style={{ color: '#DC3545', marginBottom: 8 }}>
              Explanation generation failed
            </Text>
            <Text variant="bodySmall" style={{ color: '#6B7280', textAlign: 'center', marginBottom: 16 }}>
              Please ensure you have configured a Text AI in Settings and the API key is valid.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button mode="outlined" onPress={() => (navigation as any).navigate('Settings')}>
                Go to Settings
              </Button>
              <Button mode="contained" onPress={() => regenerateExplanation(currentWord.id)}>
                Retry
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 16, color: '#6B7280' },
  headerCard: { margin: 16, backgroundColor: '#FFFFFF' },
  wordRow: { flexDirection: 'row', alignItems: 'center' },
  word: { fontWeight: 'bold', color: '#1A1A2E', flex: 1 },
  ttsButton: { margin: 0 },
  pronunciation: { color: '#6B7280', marginTop: 4 },
  langChip: { alignSelf: 'flex-start', marginTop: 8 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF' },
  sectionTitle: { fontWeight: '600', marginBottom: 8, color: '#4A90D9' },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  breakdownMeaning: { flex: 1 },
  breakdownOrigin: { color: '#9CA3AF', fontSize: 12 },
  mnemonic: { fontStyle: 'italic', color: '#6C63FF' },
  memoryImage: { width: '100%', height: 250, borderRadius: 12, marginTop: 8 },
  imagePlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, gap: 8 },
  example: { marginBottom: 8 },
  sentenceRow: { flexDirection: 'row', alignItems: 'center' },
  sentenceText: { flex: 1 },
  sentenceTts: { margin: 0, marginLeft: 4 },
  zhText: { color: '#6B7280', marginTop: 2 },
  divider: { marginVertical: 8 },
  actions: { padding: 16, alignItems: 'center' },
  generatingText: { marginTop: 16, color: '#6B7280' },
});
