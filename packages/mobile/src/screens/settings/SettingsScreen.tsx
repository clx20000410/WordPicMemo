import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { Card, Text, Button, TextInput, List, Divider, Chip, ActivityIndicator, Menu, SegmentedButtons, IconButton } from 'react-native-paper';
import { useAuthStore, useSettingsStore } from '../../store';
import { TEXT_RESPONSE_FORMATS, IMAGE_RESPONSE_FORMATS, DEFAULT_IMAGE_PROMPT_TEMPLATE } from '@wordpicmemo/shared';
import type { ResponseFormat } from '@wordpicmemo/shared';
import { useTranslation } from 'react-i18next';
import { changeLanguage, SupportedLanguage } from '../../i18n';
import { getApiBaseUrl, setApiBaseUrl, getDefaultApiBaseUrl, updateApiClientBaseUrl } from '../../services/api';

// ─── Text AI Config Card ───────────────────────────────────
function TextConfigCard() {
  const { aiConfigs, createConfig, deleteConfig, testConfig, testResult, isLoading, clearTestResult } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('openai');
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useTranslation();

  const textConfigs = aiConfigs.filter((c) => c.purpose === 'text');

  const handleSave = async () => {
    if (!apiEndpoint.trim() || !apiKey.trim() || !modelName.trim()) return;
    try {
      await createConfig({
        purpose: 'text',
        responseFormat,
        apiEndpoint: apiEndpoint.trim(),
        apiKey: apiKey.trim(),
        modelName: modelName.trim(),
      });
      setShowForm(false);
      setApiKey('');
      setApiEndpoint('');
      setModelName('');
      setResponseFormat('openai');
    } catch {}
  };

  const formatLabel = TEXT_RESPONSE_FORMATS.find((f) => f.value === responseFormat)?.label || responseFormat;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">{t('settings.textAiConfig')}</Text>
          <Button mode="text" onPress={() => setShowForm(!showForm)} compact>
            {showForm ? t('common.cancel') : t('common.add')}
          </Button>
        </View>

        {showForm && (
          <View style={styles.addForm}>
            <TextInput
              label={t('settings.apiEndpoint')}
              value={apiEndpoint}
              onChangeText={setApiEndpoint}
              mode="outlined"
              placeholder="https://api.openai.com/v1"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              label={t('settings.apiKey')}
              value={apiKey}
              onChangeText={setApiKey}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label={t('settings.modelName')}
              value={modelName}
              onChangeText={setModelName}
              mode="outlined"
              placeholder="e.g. gpt-4o-mini"
              style={styles.input}
            />

            <View style={styles.dropdownRow}>
              <Text variant="bodyMedium" style={styles.dropdownLabel}>{t('settings.responseFormat')}</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setMenuVisible(true)} compact style={styles.dropdownButton}>
                    {formatLabel}
                  </Button>
                }
              >
                {TEXT_RESPONSE_FORMATS.map((fmt) => (
                  <Menu.Item
                    key={fmt.value}
                    onPress={() => { setResponseFormat(fmt.value); setMenuVisible(false); }}
                    title={`${fmt.label}  (${fmt.description})`}
                  />
                ))}
              </Menu>
            </View>

            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!apiKey.trim() || !apiEndpoint.trim() || !modelName.trim()}
              loading={isLoading}
            >
              {t('settings.saveConfig')}
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {textConfigs.map((config) => (
          <List.Item
            key={config.id}
            title={config.modelName}
            description={`${config.responseFormat || config.provider} • ${config.apiEndpoint}`}
            right={() => (
              <View style={styles.listActions}>
                <Button mode="text" onPress={() => { clearTestResult(); testConfig(config.id); }} compact>
                  {t('common.test')}
                </Button>
                <Button
                  mode="text"
                  textColor="#DC3545"
                  onPress={() => Alert.alert(t('settings.deleteConfig'), t('settings.deleteConfigConfirm', { name: config.modelName }), [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.delete'), style: 'destructive', onPress: () => deleteConfig(config.id) },
                  ])}
                  compact
                >
                  {t('common.del')}
                </Button>
              </View>
            )}
          />
        ))}

        {textConfigs.length === 0 && !showForm && (
          <Text style={styles.emptyText}>{t('settings.noTextConfig')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Image AI Config Card ──────────────────────────────────
function ImageConfigCard() {
  const { aiConfigs, createConfig, deleteConfig, testConfig, testResult, isLoading, clearTestResult } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('dall-e');
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useTranslation();

  const imageConfigs = aiConfigs.filter((c) => c.purpose === 'image');

  const handleSave = async () => {
    if (!apiEndpoint.trim() || !apiKey.trim() || !modelName.trim()) return;
    try {
      await createConfig({
        purpose: 'image',
        responseFormat,
        apiEndpoint: apiEndpoint.trim(),
        apiKey: apiKey.trim(),
        modelName: modelName.trim(),
      });
      setShowForm(false);
      setApiKey('');
      setApiEndpoint('');
      setModelName('');
      setResponseFormat('dall-e');
    } catch {}
  };

  const formatLabel = IMAGE_RESPONSE_FORMATS.find((f) => f.value === responseFormat)?.label || responseFormat;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">{t('settings.imageAiConfig')}</Text>
          <Button mode="text" onPress={() => setShowForm(!showForm)} compact>
            {showForm ? t('common.cancel') : t('common.add')}
          </Button>
        </View>

        {showForm && (
          <View style={styles.addForm}>
            <TextInput
              label={t('settings.apiEndpoint')}
              value={apiEndpoint}
              onChangeText={setApiEndpoint}
              mode="outlined"
              placeholder="https://api.openai.com/v1"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              label={t('settings.apiKey')}
              value={apiKey}
              onChangeText={setApiKey}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label={t('settings.modelName')}
              value={modelName}
              onChangeText={setModelName}
              mode="outlined"
              placeholder="e.g. dall-e-3"
              style={styles.input}
            />

            <View style={styles.dropdownRow}>
              <Text variant="bodyMedium" style={styles.dropdownLabel}>{t('settings.responseFormat')}</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setMenuVisible(true)} compact style={styles.dropdownButton}>
                    {formatLabel}
                  </Button>
                }
              >
                {IMAGE_RESPONSE_FORMATS.map((fmt) => (
                  <Menu.Item
                    key={fmt.value}
                    onPress={() => { setResponseFormat(fmt.value); setMenuVisible(false); }}
                    title={`${fmt.label}  (${fmt.description})`}
                  />
                ))}
              </Menu>
            </View>

            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!apiKey.trim() || !apiEndpoint.trim() || !modelName.trim()}
              loading={isLoading}
            >
              {t('settings.saveConfig')}
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {imageConfigs.map((config) => (
          <List.Item
            key={config.id}
            title={config.modelName}
            description={`${config.responseFormat || 'DALL-E'} • ${config.apiEndpoint}`}
            right={() => (
              <View style={styles.listActions}>
                <Button mode="text" onPress={() => { clearTestResult(); testConfig(config.id); }} compact>
                  {t('common.test')}
                </Button>
                <Button
                  mode="text"
                  textColor="#DC3545"
                  onPress={() => Alert.alert(t('settings.deleteConfig'), t('settings.deleteConfigConfirm', { name: config.modelName }), [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.delete'), style: 'destructive', onPress: () => deleteConfig(config.id) },
                  ])}
                  compact
                >
                  {t('common.del')}
                </Button>
              </View>
            )}
          />
        ))}

        {imageConfigs.length === 0 && !showForm && (
          <Text style={styles.emptyText}>{t('settings.noImageConfig')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Image Prompt Template Card ───────────────────────────
function ImagePromptCard() {
  const { imagePromptTemplate, isSavingPrompt, fetchImagePrompt, updateImagePrompt } = useSettingsStore();
  const [draft, setDraft] = useState(imagePromptTemplate);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchImagePrompt();
  }, [fetchImagePrompt]);

  useEffect(() => {
    setDraft(imagePromptTemplate);
  }, [imagePromptTemplate]);

  const handleSave = async () => {
    try {
      await updateImagePrompt(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const handleReset = () => {
    setDraft(DEFAULT_IMAGE_PROMPT_TEMPLATE);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{t('settings.imagePromptTitle')}</Text>
        <Text variant="bodySmall" style={styles.promptHint}>
          {t('settings.imagePromptHint')}
        </Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.promptInput]}
        />
        <View style={styles.promptActions}>
          <Button mode="text" onPress={handleReset} compact>
            {t('settings.resetDefault')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSavingPrompt}
            disabled={draft === imagePromptTemplate || isSavingPrompt}
            compact
          >
            {saved ? t('settings.saved') : t('common.save')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

// ─── Language Selector Card ───────────────────────────────
function LanguageCard() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleChange = (lang: string) => {
    changeLanguage(lang as SupportedLanguage);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>🌐 {t('settings.language')}</Text>
        <SegmentedButtons
          value={currentLang}
          onValueChange={handleChange}
          buttons={[
            { value: 'zh', label: t('settings.languageZh') },
            { value: 'en', label: t('settings.languageEn') },
          ]}
        />
      </Card.Content>
    </Card>
  );
}

// ─── API URL Config Card ───────────────────────────────────
function ApiUrlCard() {
  const { t } = useTranslation();
  const [apiUrl, setApiUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setCurrentApiUrl(url);
      setApiUrl(url);
    });
  }, []);

  const handleSave = async () => {
    try {
      await setApiBaseUrl(apiUrl);
      await updateApiClientBaseUrl();
      setCurrentApiUrl(apiUrl);
      setShowConfig(false);
      Alert.alert(t('common.success'), t('home.apiUrlSaved'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Failed to save API URL');
    }
  };

  const handleReset = async () => {
    const defaultUrl = getDefaultApiBaseUrl();
    setApiUrl(defaultUrl);
    await setApiBaseUrl('');
    await updateApiClientBaseUrl();
    setCurrentApiUrl(defaultUrl);
    setShowConfig(false);
    Alert.alert(t('common.success'), t('home.apiUrlReset'));
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.apiUrlHeader}>
          <View style={styles.apiUrlHeaderLeft}>
            <Text variant="titleMedium">🔌 {t('home.apiUrl')}</Text>
            <Text variant="bodySmall" style={styles.apiUrlCurrent} numberOfLines={1}>
              {currentApiUrl}
            </Text>
          </View>
          <IconButton
            icon={showConfig ? 'chevron-up' : 'chevron-down'}
            size={20}
            onPress={() => setShowConfig(!showConfig)}
          />
        </View>
        {showConfig && (
          <View style={styles.apiUrlConfig}>
            <TextInput
              label={t('home.apiUrlLabel')}
              value={apiUrl}
              onChangeText={setApiUrl}
              mode="outlined"
              placeholder={getDefaultApiBaseUrl()}
              style={styles.apiUrlInput}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.apiUrlActions}>
              <Button mode="outlined" onPress={handleReset} compact>
                {t('home.resetApiUrl')}
              </Button>
              <Button mode="contained" onPress={handleSave} compact>
                {t('common.save')}
              </Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Settings Screen ───────────────────────────────────────
export default function SettingsScreen({ navigation }: any) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { fetchConfigs, testResult, clearTestResult } = useSettingsStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfigs();
    }
  }, [isAuthenticated, fetchConfigs]);

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      {isAuthenticated ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{t('settings.account')}</Text>
            <Text variant="bodyMedium" style={styles.userInfo}>{user?.nickname || 'User'}</Text>
            <Text variant="bodySmall" style={styles.email}>{user?.email}</Text>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{t('settings.account')}</Text>
            <Text variant="bodyMedium" style={styles.userInfo}>{t('settings.notLoggedIn')}</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              {t('auth.login')}
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Language */}
      <LanguageCard />

      {/* API URL Configuration */}
      <ApiUrlCard />

      {/* Text AI Configuration - only show when authenticated */}
      <TextConfigCard />

      {/* Image AI Configuration */}
      <ImageConfigCard />

      {/* Image Prompt Template */}
      <ImagePromptCard />

      {/* Test Result */}
      {testResult && (
        <Card style={[styles.testResultCard, { borderLeftColor: testResult.success ? '#22C55E' : '#DC3545' }]}>
          <Card.Content>
            <Text style={[styles.testResultTitle, { color: testResult.success ? '#22C55E' : '#DC3545' }]}>
              {testResult.success ? t('settings.connected') : t('settings.failed')}
              {testResult.latencyMs ? ` (${testResult.latencyMs}ms)` : ''}
            </Text>
            {!testResult.success && testResult.message && (
              <Text variant="bodySmall" style={styles.testResultMessage}>
                {testResult.message}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Logout - only show when authenticated */}
      {isAuthenticated && (
        <Button mode="outlined" onPress={logout} style={styles.logoutButton} textColor="#DC3545">
          {t('common.logout')}
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF', padding: 16 },
  card: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  userInfo: { marginTop: 8, fontWeight: '600' },
  email: { color: '#6B7280' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addForm: { marginTop: 16, gap: 12 },
  input: { backgroundColor: '#FFFFFF' },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownLabel: { color: '#374151' },
  dropdownButton: { minWidth: 140 },
  divider: { marginVertical: 12 },
  testResultCard: { marginBottom: 16, borderLeftWidth: 4, backgroundColor: '#F9FAFB' },
  testResultTitle: { fontWeight: '700', fontSize: 14 },
  testResultMessage: { color: '#6B7280', marginTop: 4, fontSize: 12 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', padding: 16 },
  listActions: { flexDirection: 'row', alignItems: 'center' },
  logoutButton: { marginTop: 8, marginBottom: 32, borderColor: '#DC3545' },
  loginButton: { marginTop: 12 },
  promptHint: { color: '#6B7280', marginTop: 4, marginBottom: 8 },
  promptInput: { minHeight: 100 },
  promptActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  apiUrlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  apiUrlHeaderLeft: { flex: 1 },
  apiUrlCurrent: { color: '#6B7280', marginTop: 4 },
  apiUrlConfig: { marginTop: 12, gap: 12 },
  apiUrlInput: { backgroundColor: '#FFFFFF' },
  apiUrlActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
