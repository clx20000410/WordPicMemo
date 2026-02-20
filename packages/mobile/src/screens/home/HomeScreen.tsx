import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { TextInput, Button, Card, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useWordStore, useReviewStore } from '../../store';

export default function HomeScreen({ navigation }: any) {
  const [newWord, setNewWord] = useState('');
  const { words, isCreating, createWord, fetchWords, isLoading, error } = useWordStore();
  const { summary, fetchSummary } = useReviewStore();

  useEffect(() => {
    fetchWords();
    fetchSummary();
  }, []);

  const handleCreateWord = useCallback(async () => {
    if (!newWord.trim()) return;
    try {
      const word = await createWord(newWord.trim());
      setNewWord('');
      navigation.navigate('WordDetail', { wordId: word.id });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create word');
    }
  }, [newWord, createWord, navigation]);

  return (
    <View style={styles.container}>
      {/* Word Input */}
      <View style={styles.inputSection}>
        <TextInput
          label="Enter a word to memorize"
          value={newWord}
          onChangeText={setNewWord}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleCreateWord}
              disabled={isCreating || !newWord.trim()}
            />
          }
          onSubmitEditing={handleCreateWord}
        />
        {isCreating && <ActivityIndicator style={styles.loader} />}
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
      </View>

      {/* Today's Review Summary */}
      {summary && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>Today's Review</Text>
            <View style={styles.summaryRow}>
              <Chip icon="clock-outline" compact>{summary.totalDue} due</Chip>
              <Chip icon="check-circle" compact>{summary.completedToday} done</Chip>
              <Chip icon="alert" compact>{summary.overdueCount} overdue</Chip>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Recent Words */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Recent Words</Text>
      <FlatList
        data={words.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.wordCard}
            onPress={() => navigation.navigate('WordDetail', { wordId: item.id })}
          >
            <Card.Content>
              <Text variant="titleMedium">{item.word}</Text>
              <Text variant="bodySmall" style={styles.wordMeta}>
                {item.language.toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.explanation?.coreDefinition && (
                <Text variant="bodyMedium" numberOfLines={2} style={styles.definition}>
                  {item.explanation.coreDefinition}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No words yet. Start by entering a word above!</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  inputSection: { padding: 16 },
  input: { backgroundColor: '#FFFFFF' },
  loader: { marginTop: 8 },
  errorText: { color: '#DC3545', marginTop: 8, fontSize: 13, padding: 8, backgroundColor: '#FFF0F0', borderRadius: 6 },
  summaryCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF' },
  summaryTitle: { marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 8 },
  wordCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFFFF' },
  wordMeta: { color: '#6B7280', marginTop: 4 },
  definition: { marginTop: 8, color: '#374151' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 32 },
});
