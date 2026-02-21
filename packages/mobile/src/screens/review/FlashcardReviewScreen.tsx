import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DueReviewItem, Word } from '@wordpicmemo/shared';
import { useReviewStore } from '../../store';
import { wordService } from '../../services';

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
}

export default function FlashcardReviewScreen({ navigation, route }: any) {
  const { t, i18n } = useTranslation();
  const { fetchReviewSchedules, markReviewViewed } = useReviewStore();

  const [reviewItem, setReviewItem] = useState<DueReviewItem | null>(null);
  const [detailWord, setDetailWord] = useState<Word | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(true);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(4 / 3);

  const routeReviewId = route?.params?.reviewId as string | undefined;
  const routeWordId = route?.params?.wordId as string | undefined;
  const rawStage = route?.params?.stage;
  const routeStage = typeof rawStage === 'number' ? rawStage : Number(rawStage);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoadingReview(true);
      const items = await fetchReviewSchedules('unreviewed');

      let target: DueReviewItem | null = items[0] || null;
      if (routeReviewId) {
        target = items.find((item) => item.review.id === routeReviewId) || null;
      } else if (routeWordId && Number.isFinite(routeStage)) {
        target =
          items.find(
            (item) => item.review.wordId === routeWordId && item.review.stage === routeStage,
          ) || null;
      }

      if (isMounted) {
        setReviewItem(target);
        setIsLoadingReview(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchReviewSchedules, routeReviewId, routeWordId, routeStage]);

  useEffect(() => {
    let isMounted = true;
    const wordId = reviewItem?.review.wordId ?? routeWordId;

    if (!wordId) {
      setDetailWord(null);
      return;
    }

    setIsLoadingWord(true);
    wordService
      .getWordById(wordId)
      .then((word) => {
        if (isMounted) {
          setDetailWord(word);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetailWord(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingWord(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reviewItem?.review.wordId, routeWordId]);

  const mergedContent = useMemo(() => {
    if (!reviewItem) {
      const fallbackExplanation = detailWord?.explanation;
      if (detailWord) {
        const isNote = detailWord.language === 'note';
        return {
          isNote,
          word: normalizeText(detailWord.word) || t('review.noWord'),
          stage: Number.isFinite(routeStage) ? routeStage : 1,
          pronunciation: normalizeText(fallbackExplanation?.pronunciation),
          definition:
            normalizeText(fallbackExplanation?.coreDefinition) || t('review.noDefinition'),
          noteContent:
            normalizeText(fallbackExplanation?.memoryScene) ||
            normalizeText(fallbackExplanation?.coreDefinition),
          mnemonic: normalizeText(fallbackExplanation?.mnemonicPhrase),
          scene: normalizeText(fallbackExplanation?.memoryScene),
          imageUrl: normalizeText(fallbackExplanation?.imageUrl || ''),
          scheduledAt: '',
        };
      }

      return {
        isNote: false,
        word: t('review.noWord'),
        stage: 1,
        pronunciation: '',
        definition: t('review.noDefinition'),
        noteContent: '',
        mnemonic: '',
        scene: '',
        imageUrl: '',
        scheduledAt: '',
      };
    }

    const explanation = reviewItem.explanation ?? detailWord?.explanation ?? null;
    const isNote = reviewItem.word?.language === 'note' || detailWord?.language === 'note';

    return {
      isNote,
      word:
        normalizeText(reviewItem.word?.word) ||
        normalizeText(detailWord?.word) ||
        t('review.noWord'),
      stage: reviewItem.review.stage,
      pronunciation: normalizeText(explanation?.pronunciation),
      definition: normalizeText(explanation?.coreDefinition) || t('review.noDefinition'),
      noteContent:
        normalizeText(explanation?.memoryScene) || normalizeText(explanation?.coreDefinition),
      mnemonic: normalizeText(explanation?.mnemonicPhrase),
      scene: normalizeText(explanation?.memoryScene),
      imageUrl: normalizeText(explanation?.imageUrl || ''),
      scheduledAt: new Date(reviewItem.review.scheduledAt).toLocaleString(
        i18n.language === 'zh' ? 'zh-CN' : 'en-US',
      ),
    };
  }, [reviewItem, detailWord, t, i18n.language, routeStage]);

  useEffect(() => {
    if (!mergedContent.imageUrl) {
      setImageAspectRatio(4 / 3);
      return;
    }

    let isMounted = true;
    Image.getSize(
      mergedContent.imageUrl,
      (width, height) => {
        if (!isMounted) {
          return;
        }
        if (width > 0 && height > 0) {
          setImageAspectRatio(width / height);
        } else {
          setImageAspectRatio(4 / 3);
        }
      },
      () => {
        if (isMounted) {
          setImageAspectRatio(4 / 3);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, [mergedContent.imageUrl]);

  const handleMarkReviewed = async () => {
    if (!reviewItem) {
      return;
    }

    try {
      setIsSubmitting(true);
      await markReviewViewed(reviewItem.review.id);
      navigation.navigate('ReviewList', { initialTab: 'reviewed' });
    } catch {}
    setIsSubmitting(false);
  };

  if (isLoadingReview) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!reviewItem && isLoadingWord) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!reviewItem && !detailWord) {
    return (
      <View style={styles.centered}>
        <Text variant="titleLarge" style={styles.emptyTitle}>{t('review.noUnreviewed')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
          {t('review.backToReviews')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerMeta}>
        <Chip compact>{t('review.stage', { stage: mergedContent.stage })}</Chip>
        {mergedContent.scheduledAt ? (
          <Text variant="bodySmall" style={styles.scheduledText}>
            {t('review.scheduledAt')}: {mergedContent.scheduledAt}
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.flashcard}>
          <Card.Content style={styles.flashcardContent}>
            <Text variant="headlineLarge" style={styles.wordText}>{mergedContent.word}</Text>
            {mergedContent.pronunciation ? (
              <Text variant="bodyLarge" style={styles.pronunciation}>{mergedContent.pronunciation}</Text>
            ) : null}

            {mergedContent.isNote ? (
              <View style={styles.section}>
                <Text variant="titleSmall" style={styles.sectionTitle}>{t('home.noteContentLabel')}</Text>
                <Text style={styles.definition}>
                  {mergedContent.noteContent || mergedContent.definition}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>{t('wordDetail.coreDefinition')}</Text>
                  <Text style={styles.definition}>{mergedContent.definition}</Text>
                </View>

                {mergedContent.mnemonic ? (
                  <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>{t('wordDetail.mnemonic')}</Text>
                    <Text style={styles.mnemonic}>{mergedContent.mnemonic}</Text>
                  </View>
                ) : null}

                {mergedContent.scene ? (
                  <View style={styles.section}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>{t('wordDetail.memoryScene')}</Text>
                    <Text style={styles.scene}>{mergedContent.scene}</Text>
                  </View>
                ) : null}
              </>
            )}

            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>{t('wordDetail.memoryImage')}</Text>
              {mergedContent.imageUrl ? (
                <View style={[styles.imageContainer, { aspectRatio: imageAspectRatio }]}>
                  <Image source={{ uri: mergedContent.imageUrl }} style={styles.image} resizeMode="cover" />
                </View>
              ) : isLoadingWord ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator />
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>{t('review.noImage')}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.bottomActions}>
        {reviewItem ? (
          <Button
            mode="contained"
            onPress={handleMarkReviewed}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.doneButton}
          >
            {t('review.markAsReviewed')}
          </Button>
        ) : (
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t('review.backToReviews')}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280' },
  emptyTitle: { color: '#6B7280', marginBottom: 16 },
  backButton: { paddingHorizontal: 20 },
  headerMeta: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  scheduledText: { color: '#6B7280', flex: 1, textAlign: 'right' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  flashcard: { backgroundColor: '#FFFFFF', borderRadius: 16 },
  flashcardContent: { padding: 20 },
  wordText: { fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  pronunciation: { color: '#6B7280', textAlign: 'center', marginTop: 6 },
  section: { marginTop: 18 },
  sectionTitle: { color: '#4A90D9', marginBottom: 6, fontWeight: '700' },
  definition: { color: '#1F2937', lineHeight: 22 },
  mnemonic: { color: '#6C63FF', fontStyle: 'italic', lineHeight: 22 },
  scene: { color: '#6B7280', lineHeight: 21 },
  imageContainer: {
    width: '100%',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { color: '#9CA3AF' },
  bottomActions: { padding: 16, backgroundColor: '#FAFBFF' },
  doneButton: { paddingVertical: 8, backgroundColor: '#22C55E' },
});

