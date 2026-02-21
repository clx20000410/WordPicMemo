import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { useWordStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { ttsService } from '../../services';
import { useTranslation } from 'react-i18next';

interface BreakdownDisplayItem {
  part: string;
  meaning: string;
  origin: string;
}

function normalizeBreakdownText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

export default function WordDetailScreen({ route }: any) {
  const { wordId } = route.params;
  const { currentWord, fetchWordById, regenerateExplanation, regenerateImage, isLoading } = useWordStore();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [memoryImageRatio, setMemoryImageRatio] = useState(4 / 3);

  useEffect(() => {
    fetchWordById(wordId);
  }, [wordId, fetchWordById]);

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

  useEffect(() => {
    const imageUrl = currentWord?.explanation?.imageUrl;
    if (!imageUrl || currentWord?.explanation?.imageStatus !== 'completed') {
      setMemoryImageRatio(4 / 3);
      return;
    }

    let isMounted = true;
    Image.getSize(
      imageUrl,
      (width, height) => {
        if (!isMounted) {
          return;
        }
        if (width > 0 && height > 0) {
          setMemoryImageRatio(width / height);
        } else {
          setMemoryImageRatio(4 / 3);
        }
      },
      () => {
        if (isMounted) {
          setMemoryImageRatio(4 / 3);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, [currentWord?.explanation?.imageStatus, currentWord?.explanation?.imageUrl]);

  const exp = currentWord?.explanation;
  const isGenerating = exp?.explanationStatus === 'generating' || exp?.explanationStatus === 'pending';
  const isNote = currentWord?.language === 'note';
  const breakdownItems = useMemo<BreakdownDisplayItem[]>(() => {
    if (!Array.isArray(exp?.wordBreakdown)) {
      return [];
    }

    return exp.wordBreakdown
      .map((item: any) => {
        const part = normalizeBreakdownText(item?.part);
        const meaning = normalizeBreakdownText(item?.meaning);
        const origin = normalizeBreakdownText(item?.origin);

        return { part, meaning, origin };
      })
      .filter((item) => item.part || item.meaning || item.origin);
  }, [exp?.wordBreakdown]);

  if (isLoading || !currentWord) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('wordDetail.loading')}</Text>
      </View>
    );
  }

  if (isNote) {
    const noteText = exp?.memoryScene?.trim() || exp?.coreDefinition?.trim() || t('review.noDefinition');
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Chip compact style={styles.langChip}>{t('home.noteType')}</Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.noteContentText}>
              {noteText}
            </Text>
          </Card.Content>
        </Card>

        {exp?.imageUrl ? (
          <Card style={styles.card}>
            <Card.Content>
              <View style={[styles.memoryImageContainer, { aspectRatio: memoryImageRatio }]}>
                <Image source={{ uri: exp.imageUrl }} style={styles.memoryImage} resizeMode="cover" />
              </View>
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>
    );
  }

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
            <Text style={styles.generatingText}>{t('wordDetail.generating')}</Text>
          </Card.Content>
        </Card>
      ) : exp?.explanationStatus === 'completed' ? (
        <>
          {/* 2. Example Sentences (with TTS) */}
          {exp.exampleSentences && exp.exampleSentences.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>{t('wordDetail.exampleSentences')}</Text>
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
              <Text variant="titleMedium" style={styles.sectionTitle}>{t('wordDetail.coreDefinition')}</Text>
              <Text variant="bodyLarge">{exp.coreDefinition}</Text>
            </Card.Content>
          </Card>

          {/* 4. Word Breakdown */}
          {breakdownItems.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>{t('wordDetail.wordBreakdown')}</Text>
                {breakdownItems.map((item, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    {item.part ? (
                      <Chip compact style={styles.breakdownChip}>
                        {item.part}
                      </Chip>
                    ) : null}
                    {item.meaning ? (
                      <Text style={styles.breakdownMeaning}>{item.meaning}</Text>
                    ) : null}
                    {item.origin ? (
                      <Text style={styles.breakdownOrigin}>{item.origin}</Text>
                    ) : null}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* 5. Mnemonic */}
          {exp.mnemonicPhrase && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>{t('wordDetail.mnemonic')}</Text>
                <Text variant="bodyLarge" style={styles.mnemonic}>{exp.mnemonicPhrase}</Text>
              </Card.Content>
            </Card>
          )}

          {/* 6. Memory Scene */}
          {exp.memoryScene && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>{t('wordDetail.memoryScene')}</Text>
                <Text variant="bodyMedium">{exp.memoryScene}</Text>
              </Card.Content>
            </Card>
          )}

          {/* 7. Memory Image */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>{t('wordDetail.memoryImage')}</Text>
              {exp.imageStatus === 'completed' && exp.imageUrl ? (
                <View style={[styles.memoryImageContainer, { aspectRatio: memoryImageRatio }]}>
                  <Image source={{ uri: exp.imageUrl }} style={styles.memoryImage} resizeMode="cover" />
                </View>
              ) : exp.imageStatus === 'generating' || exp.imageStatus === 'pending' ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator />
                  <Text>{t('wordDetail.generatingImage')}</Text>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text>{t('wordDetail.imageFailed')}</Text>
                  <Button mode="outlined" onPress={() => regenerateImage(currentWord.id)}>
                    {t('common.retry')}
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* 8. Actions */}
          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => regenerateExplanation(currentWord.id)} icon="refresh">
              {t('wordDetail.regenerate')}
            </Button>
          </View>
        </>
      ) : (
        <Card style={styles.card}>
          <Card.Content style={styles.centered}>
            <Text variant="titleMedium" style={{ color: '#DC3545', marginBottom: 8 }}>
              {t('wordDetail.explanationFailed')}
            </Text>
            <Text variant="bodySmall" style={{ color: '#6B7280', textAlign: 'center', marginBottom: 16 }}>
              {t('wordDetail.explanationFailedHint')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button mode="outlined" onPress={() => (navigation as any).getParent()?.navigate('Settings')}>
                {t('wordDetail.goToSettings')}
              </Button>
              <Button mode="contained" onPress={() => regenerateExplanation(currentWord.id)}>
                {t('common.retry')}
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
  breakdownItem: {
    marginBottom: 10,
    backgroundColor: '#F7F9FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  breakdownChip: { alignSelf: 'flex-start', marginBottom: 8 },
  breakdownMeaning: { color: '#1A1A2E', lineHeight: 21 },
  breakdownOrigin: { color: '#6B7280', fontSize: 12, lineHeight: 18, marginTop: 6 },
  mnemonic: { fontStyle: 'italic', color: '#6C63FF' },
  noteContentText: { color: '#1F2937', lineHeight: 23 },
  memoryImageContainer: {
    width: '100%',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  memoryImage: { width: '100%', height: '100%' },
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
