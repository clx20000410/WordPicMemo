import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useReviewStore } from '../../store';
import { REVIEW_INTERVALS } from '@wordpicmemo/shared';

export default function ReviewListScreen({ navigation }: any) {
  const { dueReviews, summary, fetchDueReviews, fetchSummary, isLoading } = useReviewStore();

  useEffect(() => {
    fetchDueReviews();
    fetchSummary();
  }, []);

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      {summary && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.summaryTitle}>Today's Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text variant="headlineMedium" style={styles.statNumber}>{summary.totalDue}</Text>
                <Text variant="bodySmall">Due</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#22C55E' }]}>{summary.completedToday}</Text>
                <Text variant="bodySmall">Done</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#DC3545' }]}>{summary.overdueCount}</Text>
                <Text variant="bodySmall">Overdue</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Start Review Button */}
      {dueReviews.length > 0 && (
        <Button
          mode="contained"
          onPress={() => navigation.navigate('FlashcardReview')}
          style={styles.startButton}
          icon="cards"
        >
          Start Review ({dueReviews.length} cards)
        </Button>
      )}

      {/* Review List */}
      <FlatList
        data={dueReviews}
        keyExtractor={(item) => item.review.id}
        renderItem={({ item }) => {
          const interval = REVIEW_INTERVALS.find((i) => i.stage === item.review.stage);
          return (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardRow}>
                  <Text variant="titleMedium">{item.word.word}</Text>
                  <Chip compact>Stage {item.review.stage}</Chip>
                </View>
                <Text variant="bodySmall" style={styles.intervalLabel}>
                  {interval?.labelZh || interval?.label}
                </Text>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No reviews due right now.</Text>
            </View>
          ) : (
            <ActivityIndicator style={styles.loader} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  summaryCard: { margin: 16, backgroundColor: '#FFFFFF' },
  summaryTitle: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNumber: { fontWeight: 'bold', color: '#4A90D9' },
  startButton: { marginHorizontal: 16, marginBottom: 16 },
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFFFF' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  intervalLabel: { color: '#6B7280', marginTop: 4 },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyTitle: { marginBottom: 8 },
  emptyText: { color: '#9CA3AF' },
  loader: { marginTop: 32 },
});
