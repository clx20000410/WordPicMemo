import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { Searchbar, Card, Text, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useWordStore } from '../../store';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function WordListScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { words, fetchWords, deleteWord, isLoading, page, totalPages } = useWordStore();

  const dateStr = selectedDate ? formatDate(selectedDate) : undefined;

  useEffect(() => {
    fetchWords(1, search || undefined, dateStr);
  }, [search, dateStr]);

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
      '确认删除',
      `确定要删除单词 "${wordText}" 吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
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
      {/* Search + Date Filter Row */}
      <View style={styles.filterRow}>
        <Searchbar
          placeholder="Search words..."
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
            {formatDisplayDate(selectedDate)}
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
        data={words}
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
          !isLoading ? <Text style={styles.empty}>No words found</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16 },
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
