import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Card, Text, Button, TextInput, List, Divider, Chip, ActivityIndicator, Menu } from 'react-native-paper';
import { useAuthStore, useSettingsStore } from '../../store';
import { TEXT_RESPONSE_FORMATS, IMAGE_RESPONSE_FORMATS } from '@wordpicmemo/shared';
import type { ResponseFormat } from '@wordpicmemo/shared';

// ─── Text AI Config Card ───────────────────────────────────
function TextConfigCard() {
  const { aiConfigs, createConfig, testConfig, testResult, isLoading, clearTestResult } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('openai');
  const [menuVisible, setMenuVisible] = useState(false);

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
          <Text variant="titleMedium">📝 Text AI Config</Text>
          <Button mode="text" onPress={() => setShowForm(!showForm)} compact>
            {showForm ? 'Cancel' : 'Add'}
          </Button>
        </View>

        {showForm && (
          <View style={styles.addForm}>
            <TextInput
              label="API Endpoint"
              value={apiEndpoint}
              onChangeText={setApiEndpoint}
              mode="outlined"
              placeholder="https://api.openai.com/v1"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              label="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Model Name"
              value={modelName}
              onChangeText={setModelName}
              mode="outlined"
              placeholder="e.g. gpt-4o-mini"
              style={styles.input}
            />

            <View style={styles.dropdownRow}>
              <Text variant="bodyMedium" style={styles.dropdownLabel}>Response Format:</Text>
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
              Save Configuration
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
              <Button mode="text" onPress={() => { clearTestResult(); testConfig(config.id); }} compact>
                Test
              </Button>
            )}
          />
        ))}

        {textConfigs.length === 0 && !showForm && (
          <Text style={styles.emptyText}>No text AI configurations yet.</Text>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Image AI Config Card ──────────────────────────────────
function ImageConfigCard() {
  const { aiConfigs, createConfig, testConfig, testResult, isLoading, clearTestResult } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');

  const imageConfigs = aiConfigs.filter((c) => c.purpose === 'image');

  const handleSave = async () => {
    if (!apiEndpoint.trim() || !apiKey.trim() || !modelName.trim()) return;
    try {
      await createConfig({
        purpose: 'image',
        responseFormat: 'dall-e',
        apiEndpoint: apiEndpoint.trim(),
        apiKey: apiKey.trim(),
        modelName: modelName.trim(),
      });
      setShowForm(false);
      setApiKey('');
      setApiEndpoint('');
      setModelName('');
    } catch {}
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">🖼️ Image AI Config</Text>
          <Button mode="text" onPress={() => setShowForm(!showForm)} compact>
            {showForm ? 'Cancel' : 'Add'}
          </Button>
        </View>

        {showForm && (
          <View style={styles.addForm}>
            <TextInput
              label="API Endpoint"
              value={apiEndpoint}
              onChangeText={setApiEndpoint}
              mode="outlined"
              placeholder="https://api.openai.com/v1"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              label="API Key"
              value={apiKey}
              onChangeText={setApiKey}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Model Name"
              value={modelName}
              onChangeText={setModelName}
              mode="outlined"
              placeholder="e.g. dall-e-3"
              style={styles.input}
            />

            <View style={styles.dropdownRow}>
              <Text variant="bodyMedium" style={styles.dropdownLabel}>Response Format:</Text>
              <Chip compact>DALL-E (fixed)</Chip>
            </View>

            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!apiKey.trim() || !apiEndpoint.trim() || !modelName.trim()}
              loading={isLoading}
            >
              Save Configuration
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {imageConfigs.map((config) => (
          <List.Item
            key={config.id}
            title={config.modelName}
            description={`DALL-E • ${config.apiEndpoint}`}
            right={() => (
              <Button mode="text" onPress={() => { clearTestResult(); testConfig(config.id); }} compact>
                Test
              </Button>
            )}
          />
        ))}

        {imageConfigs.length === 0 && !showForm && (
          <Text style={styles.emptyText}>No image AI configurations yet.</Text>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Settings Screen ───────────────────────────────────────
export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { fetchConfigs, testResult, clearTestResult } = useSettingsStore();

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Account</Text>
          <Text variant="bodyMedium" style={styles.userInfo}>{user?.nickname || 'User'}</Text>
          <Text variant="bodySmall" style={styles.email}>{user?.email}</Text>
        </Card.Content>
      </Card>

      {/* Text AI Configuration */}
      <TextConfigCard />

      {/* Image AI Configuration */}
      <ImageConfigCard />

      {/* Test Result */}
      {testResult && (
        <Card style={[styles.testResultCard, { borderLeftColor: testResult.success ? '#22C55E' : '#DC3545' }]}>
          <Card.Content>
            <Text style={[styles.testResultTitle, { color: testResult.success ? '#22C55E' : '#DC3545' }]}>
              {testResult.success ? '✓ Connected' : '✗ Failed'}
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

      {/* Logout */}
      <Button mode="outlined" onPress={logout} style={styles.logoutButton} textColor="#DC3545">
        Logout
      </Button>
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
  logoutButton: { marginTop: 8, marginBottom: 32, borderColor: '#DC3545' },
});
