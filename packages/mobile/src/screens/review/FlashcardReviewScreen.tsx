import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, Card, ProgressBar } from 'react-native-paper';
import { useReviewStore } from '../../store';

export default function FlashcardReviewScreen({ navigation }: any) {
  const { dueReviews, currentReviewIndex, completeReview, nextReview, resetReviewSession } = useReviewStore();
  const [showAnswer, setShowAnswer] = useState(false);
  const [totalCards] = useState(dueReviews.length);

  useEffect(() => {
    resetReviewSession();
  }, []);

  const currentItem = dueReviews[currentReviewIndex];

  if (!currentItem || dueReviews.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="headlineMedium" style={styles.doneTitle}>Review Complete!</Text>
        <Text style={styles.doneText}>You've reviewed all due cards.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.doneButton}>
          Back to Reviews
        </Button>
      </View>
    );
  }

  const progress = totalCards > 0 ? (totalCards - dueReviews.length) / totalCards : 0;

  const handleResponse = async (remembered: boolean) => {
    try {
      await completeReview(currentItem.review.id, remembered, remembered ? 4 : 2);
      setShowAnswer(false);
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressSection}>
        <ProgressBar progress={progress} style={styles.progressBar} />
        <Text variant="bodySmall" style={styles.progressText}>
          {totalCards - dueReviews.length} / {totalCards}
        </Text>
      </View>

      {/* Card */}
      <Pressable style={styles.cardContainer} onPress={() => setShowAnswer(!showAnswer)}>
        <Card style={styles.flashcard}>
          <Card.Content style={styles.flashcardContent}>
            <Text variant="headlineLarge" style={styles.wordText}>
              {currentItem.word.word}
            </Text>

            {!showAnswer ? (
              <Text style={styles.tapHint}>Tap to reveal answer</Text>
            ) : (
              <View style={styles.answerSection}>
                {currentItem.explanation?.pronunciation && (
                  <Text variant="bodyLarge" style={styles.pronunciation}>
                    {currentItem.explanation.pronunciation}
                  </Text>
                )}
                <Text variant="titleMedium" style={styles.definition}>
                  {currentItem.explanation?.coreDefinition || 'No definition available'}
                </Text>
                {currentItem.explanation?.mnemonicPhrase && (
                  <Text variant="bodyMedium" style={styles.mnemonic}>
                    {currentItem.explanation.mnemonicPhrase}
                  </Text>
                )}
                {currentItem.explanation?.memoryScene && (
                  <Text variant="bodySmall" style={styles.scene}>
                    {currentItem.explanation.memoryScene}
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </Pressable>

      {/* Response Buttons */}
      {showAnswer && (
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={() => handleResponse(false)}
            style={[styles.responseButton, styles.forgotButton]}
            labelStyle={styles.buttonLabel}
          >
            Forgot
          </Button>
          <Button
            mode="contained"
            onPress={() => handleResponse(true)}
            style={[styles.responseButton, styles.rememberedButton]}
            labelStyle={styles.buttonLabel}
          >
            Remembered
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  doneTitle: { fontWeight: 'bold', color: '#22C55E', marginBottom: 8 },
  doneText: { color: '#6B7280', marginBottom: 24 },
  doneButton: { paddingHorizontal: 32 },
  progressSection: { padding: 16 },
  progressBar: { height: 6, borderRadius: 3 },
  progressText: { textAlign: 'right', marginTop: 4, color: '#6B7280' },
  cardContainer: { flex: 1, padding: 16 },
  flashcard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16 },
  flashcardContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  wordText: { fontWeight: 'bold', color: '#1A1A2E', marginBottom: 24 },
  tapHint: { color: '#9CA3AF' },
  answerSection: { alignItems: 'center', gap: 12 },
  pronunciation: { color: '#6B7280' },
  definition: { textAlign: 'center', color: '#374151' },
  mnemonic: { textAlign: 'center', fontStyle: 'italic', color: '#6C63FF' },
  scene: { textAlign: 'center', color: '#6B7280', marginTop: 8 },
  buttonRow: { flexDirection: 'row', padding: 16, gap: 16 },
  responseButton: { flex: 1, paddingVertical: 8 },
  forgotButton: { backgroundColor: '#DC3545' },
  rememberedButton: { backgroundColor: '#22C55E' },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
});
