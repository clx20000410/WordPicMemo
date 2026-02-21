import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Text, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useWordStore, useReviewStore } from '../../store';
import { launchImageLibrary } from 'react-native-image-picker';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('word');
  const [newWord, setNewWord] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteImageDataUrl, setNoteImageDataUrl] = useState<string | null>(null);
  const [noteImagePreviewUri, setNoteImagePreviewUri] = useState<string | null>(null);
  const {
    isCreating,
    createWord,
    createNote,
    fetchWords,
    error,
  } = useWordStore();
  const { summary, fetchSummary } = useReviewStore();

  useEffect(() => {
    fetchWords();
    fetchSummary();
  }, [fetchWords, fetchSummary]);

  const handleCreateWord = useCallback(async () => {
    if (!newWord.trim()) return;
    try {
      const word = await createWord(newWord.trim());
      setNewWord('');
      navigation.navigate('WordDetail', { wordId: word.id });
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Failed to create word');
    }
  }, [newWord, createWord, navigation, t]);

  const handlePickNoteImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 1600,
      maxWidth: 1600,
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert(t('common.error'), result.errorMessage || result.errorCode);
      return;
    }

    const asset = result.assets?.[0];
    if (!asset) {
      return;
    }

    const mimeType = asset.type || 'image/jpeg';
    const base64 = asset.base64;
    if (!base64) {
      Alert.alert(t('common.error'), t('home.imageBase64Missing'));
      return;
    }

    const dataUrl = `data:${mimeType};base64,${base64}`;
    setNoteImageDataUrl(dataUrl);
    setNoteImagePreviewUri(asset.uri || dataUrl);
  }, [t]);

  const handleCreateNote = useCallback(async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert(t('common.error'), t('home.noteValidation'));
      return;
    }

    try {
      const note = await createNote(
        noteTitle.trim(),
        noteContent.trim(),
        noteImageDataUrl || undefined,
      );
      setNoteTitle('');
      setNoteContent('');
      setNoteImageDataUrl(null);
      setNoteImagePreviewUri(null);
      navigation.navigate('WordDetail', { wordId: note.id });
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Failed to create note');
    }
  }, [noteTitle, noteContent, noteImageDataUrl, createNote, navigation, t]);

  const insertRichSnippet = useCallback((snippet: string) => {
    setNoteContent((prev) => {
      if (!prev.trim()) {
        return snippet;
      }
      return `${prev}\n${snippet}`;
    });
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'word', label: t('home.wordTab'), icon: 'alpha-w-box-outline' },
              { value: 'note', label: t('home.noteTab'), icon: 'text-box-outline' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Word Memory Tab */}
        {activeTab === 'word' && (
          <View style={styles.inputSection}>
            <TextInput
              label={t('home.enterWord')}
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
              <Text style={styles.errorText}>{t('home.errorPrefix', { message: error })}</Text>
            )}
          </View>
        )}

        {/* Note Content Tab */}
        {activeTab === 'note' && (
          <Card style={styles.noteCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.noteTitle}>
                {t('home.noteSectionTitle')}
              </Text>
              <TextInput
                label={t('home.noteTitleLabel')}
                value={noteTitle}
                onChangeText={setNoteTitle}
                mode="outlined"
                style={styles.noteInput}
                maxLength={100}
              />
              <View style={styles.toolbarRow}>
                <Button compact mode="outlined" onPress={() => insertRichSnippet('## 标题')}>
                  H2
                </Button>
                <Button compact mode="outlined" onPress={() => insertRichSnippet('**加粗内容**')}>
                  B
                </Button>
                <Button compact mode="outlined" onPress={() => insertRichSnippet('*斜体内容*')}>
                  I
                </Button>
                <Button compact mode="outlined" onPress={() => insertRichSnippet('- 列表项')}>
                  •
                </Button>
              </View>
              <TextInput
                label={t('home.noteContentLabel')}
                value={noteContent}
                onChangeText={setNoteContent}
                mode="outlined"
                multiline
                numberOfLines={8}
                style={styles.noteContentInput}
                placeholder={t('home.noteContentHint')}
              />
              <View style={styles.noteActions}>
                <Button mode="outlined" icon="image-outline" onPress={handlePickNoteImage}>
                  {t('home.pickImage')}
                </Button>
                {noteImagePreviewUri ? (
                  <Button
                    mode="text"
                    icon="close"
                    onPress={() => {
                      setNoteImageDataUrl(null);
                      setNoteImagePreviewUri(null);
                    }}
                  >
                    {t('home.removeImage')}
                  </Button>
                ) : null}
              </View>
              {noteImagePreviewUri ? (
                <Image
                  source={{ uri: noteImagePreviewUri }}
                  style={styles.noteImagePreview}
                  resizeMode="cover"
                />
              ) : null}
              <Button
                mode="contained"
                icon="content-save-outline"
                style={styles.saveNoteButton}
                onPress={handleCreateNote}
                loading={isCreating}
                disabled={isCreating || !noteTitle.trim() || !noteContent.trim()}
              >
                {t('home.saveNote')}
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Review Summary */}
        {summary && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.summaryTitle}>{t('home.todayReview')}</Text>
              <View style={styles.summaryRow}>
                <Chip icon="clock-outline" compact>{summary.totalDue} {t('home.due')}</Chip>
                <Chip icon="check-circle" compact>{summary.completedToday} {t('home.done')}</Chip>
                <Chip icon="alert" compact>{summary.overdueCount} {t('home.overdue')}</Chip>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  scrollContent: { paddingBottom: 24 },
  tabContainer: { padding: 16, paddingBottom: 8 },
  segmentedButtons: { alignSelf: 'center' },
  inputSection: { paddingHorizontal: 16 },
  input: { backgroundColor: '#FFFFFF' },
  loader: { marginTop: 8 },
  errorText: { color: '#DC3545', marginTop: 8, fontSize: 13, padding: 8, backgroundColor: '#FFF0F0', borderRadius: 6 },
  noteCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF' },
  noteTitle: { marginBottom: 10 },
  noteInput: { marginBottom: 10, backgroundColor: '#FFFFFF' },
  noteContentInput: { backgroundColor: '#FFFFFF' },
  toolbarRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  noteActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  noteImagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#F3F4F6',
  },
  saveNoteButton: { marginTop: 12 },
  summaryCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF' },
  summaryTitle: { marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 8 },
});
