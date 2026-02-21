import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Searchbar, Card, Text, ActivityIndicator, IconButton, Chip, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useWordStore } from '../../store';

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

export default function WordListScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('word');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { words, fetchWords, deleteWord, isLoading, page, totalPages } = useWordStore();

  const dateStr = selectedDate ? formatDate(selectedDate) : undefined;

  // Filter words based on active tab
  const filteredWords = useMemo(() => {
    if (activeTab === 'word') {
      return words.filter((word) => word.language !== 'note');
    } else {
      return words.filter((word) => word.language === 'note');
    }
  }, [words, activeTab]);

  useEffect(() => {
    fetchWords(1, search || undefined, dateStr);
  }, [search, dateStr, fetchWords]);

  const loadMore = useCallback(() => {
    if (!isLoading && page < totalPages) {
      fetchWords(page + 1, search || undefined, dateStr);
    }
  }, [isLoading, page, totalPages, search, dateStr]);

  const handleDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const handleDelete = (wordId: string, wordText: string) => {
    Alert.alert(
      t('words.confirmDelete'),
      t('words.confirmDeleteMessage', { word: wordText }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteWord(wordId).catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'word', label: t('home.wordTab') },
            { value: 'note', label: t('home.noteTab') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Search + Date Filter Row */}
      <View style={styles.filterRow}>
        <Searchbar
          placeholder={t('words.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
        />
        <IconButton
          icon="calendar"
          size={24}
          iconColor="#4A90D9"
          onPress={() => setShowDatePicker(true)}
          style={styles.calendarButton}
        />
      </View>

      {/* Date Filter Chip */}
      {selectedDate && (
        <View style={styles.dateChipRow}>
          <Chip
            icon="calendar"
            onClose={clearDateFilter}
            style={styles.dateChip}
          >
            {formatDisplayDate(selectedDate, i18n.language)}
          </Chip>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('Home', { screen: 'WordDetail', params: { wordId: item.id } })}
            onLongPress={() => handleDelete(item.id, item.word)}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <Text variant="titleMedium">{item.word}</Text>
                {item.explanation?.coreDefinition && (
                  <Text variant="bodySmall" numberOfLines={1} style={styles.definition}>
                    {item.explanation.coreDefinition}
                  </Text>
                )}
              </View>
              <View style={styles.cardRight}>
                <Text variant="bodySmall" style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor="#DC3545"
                  onPress={() => handleDelete(item.id, item.word)}
                  style={styles.deleteButton}
                />
              </View>
            </Card.Content>
          </Card>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ActivityIndicator style={styles.footer} /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>
              {activeTab === 'word' ? t('home.noWord') : t('home.noNote')}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  tabContainer: { padding: 16, paddingBottom: 8 },
  segmentedButtons: { alignSelf: 'center' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16 },
  searchbar: { flex: 1, backgroundColor: '#FFFFFF' },
  calendarButton: { marginLeft: 4 },
  dateChipRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8 },
  dateChip: { backgroundColor: '#EBF5FF' },
  card: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFFFF' },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  definition: { color: '#6B7280', marginTop: 4 },
  date: { color: '#9CA3AF' },
  deleteButton: { margin: 0 },
  footer: { padding: 16 },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: 32 },
});
