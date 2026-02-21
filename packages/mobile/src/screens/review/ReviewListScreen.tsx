import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import { Card, Text, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { DueReviewItem, ReviewListStatus, REVIEW_INTERVALS } from '@wordpicmemo/shared';
import { useReviewStore } from '../../store';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date, locale: string): string {
  const loc = locale === 'zh' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
}

function formatDateTime(value: Date | string, locale: string): string {
  const loc = locale === 'zh' ? 'zh-CN' : 'en-US';
  return new Date(value).toLocaleString(loc, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReviewListScreen({ navigation, route }: any) {
  const { t, i18n } = useTranslation();
  const initialTab: ReviewListStatus =
    route?.params?.initialTab === 'reviewed' ? 'reviewed' : 'unreviewed';

  const [activeTab, setActiveTab] = useState<ReviewListStatus>(initialTab);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    dueReviews,
    reviewedReviews,
    summary,
    fetchReviewSchedules,
    fetchSummary,
    isLoading,
  } = useReviewStore();

  const dateStr = selectedDate ? formatDate(selectedDate) : undefined;

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchReviewSchedules('unreviewed', dateStr),
      fetchReviewSchedules('reviewed', dateStr),
      fetchSummary(),
    ]);
  }, [fetchReviewSchedules, fetchSummary, dateStr]);

  useEffect(() => {
    refreshData().catch(() => {});
  }, [refreshData]);

  useEffect(() => {
    if (route?.params?.initialTab === 'reviewed' || route?.params?.initialTab === 'unreviewed') {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: undefined });
    }
  }, [route?.params?.initialTab, navigation]);

  const handleDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const openReviewDetail = (item: DueReviewItem) => {
    navigation.navigate('FlashcardReview', {
      reviewId: item.review.id,
      wordId: item.review.wordId,
      stage: item.review.stage,
    });
  };

  const listData = activeTab === 'unreviewed' ? dueReviews : reviewedReviews;

  return (
    <View style={styles.container}>
      {summary && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.summaryTitle}>{t('review.todayProgress')}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text variant="headlineMedium" style={styles.statNumber}>{summary.totalDue}</Text>
                <Text variant="bodySmall">{t('review.due')}</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#22C55E' }]}>
                  {summary.completedToday}
                </Text>
                <Text variant="bodySmall">{t('review.done')}</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#DC3545' }]}>
                  {summary.overdueCount}
                </Text>
                <Text variant="bodySmall">{t('review.overdue')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.tabRow}>
        <Button
          mode={activeTab === 'unreviewed' ? 'contained' : 'outlined'}
          style={styles.tabButton}
          onPress={() => setActiveTab('unreviewed')}
        >
          {t('review.unreviewedTab')} ({dueReviews.length})
        </Button>
        <Button
          mode={activeTab === 'reviewed' ? 'contained' : 'outlined'}
          style={styles.tabButton}
          onPress={() => setActiveTab('reviewed')}
        >
          {t('review.reviewedTab')} ({reviewedReviews.length})
        </Button>
      </View>

      <View style={styles.filterRow}>
        <Chip icon="calendar" onClose={selectedDate ? clearDateFilter : undefined} style={styles.dateChip}>
          {selectedDate ? formatDisplayDate(selectedDate, i18n.language) : t('review.allDates')}
        </Chip>
        <IconButton
          icon="calendar"
          size={22}
          iconColor="#4A90D9"
          onPress={() => setShowDatePicker(true)}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={listData}
        keyExtractor={(item) => item.review.id}
        renderItem={({ item }) => {
          const interval = REVIEW_INTERVALS.find((i) => i.stage === item.review.stage);
          const isReviewedTab = activeTab === 'reviewed';
          return (
            <Card
              style={styles.card}
              onPress={!isReviewedTab ? () => openReviewDetail(item) : undefined}
            >
              <Card.Content>
                <View style={styles.cardTopRow}>
                  <Text variant="titleMedium" style={styles.wordText}>{item.word.word}</Text>
                  <Chip compact>{t('review.stage', { stage: item.review.stage })}</Chip>
                </View>
                <Text variant="bodySmall" style={styles.intervalLabel}>
                  {i18n.language === 'zh' ? (interval?.labelZh || interval?.label) : (interval?.label || interval?.labelZh)}
                </Text>
                <Text variant="bodySmall" style={styles.timeText}>
                  {t('review.scheduledAt')}: {formatDateTime(item.review.scheduledAt, i18n.language)}
                </Text>
                {isReviewedTab && item.review.completedAt ? (
                  <Text variant="bodySmall" style={[styles.timeText, styles.completedText]}>
                    {t('review.completedAt')}: {formatDateTime(item.review.completedAt, i18n.language)}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          );
        }}
        ListFooterComponent={isLoading ? <ActivityIndicator style={styles.loader} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {activeTab === 'unreviewed' ? t('review.noUnreviewed') : t('review.noReviewed')}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  summaryCard: { margin: 16, marginBottom: 10, backgroundColor: '#FFFFFF' },
  summaryTitle: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNumber: { fontWeight: 'bold', color: '#4A90D9' },
  tabRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  tabButton: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dateChip: { backgroundColor: '#EBF5FF' },
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFFFF' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordText: { flex: 1, marginRight: 10 },
  intervalLabel: { color: '#6B7280', marginTop: 5 },
  timeText: { color: '#6B7280', marginTop: 4 },
  completedText: { color: '#16A34A' },
  loader: { marginTop: 24 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#6B7280' },
});
