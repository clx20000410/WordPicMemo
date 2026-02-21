import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton, Card } from 'react-native-paper';
import { useAuthStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { getApiBaseUrl, setApiBaseUrl, getDefaultApiBaseUrl, updateApiClientBaseUrl } from '../../services/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setCurrentApiUrl(url);
      setApiUrl(url);
    });
  }, []);

  const handleSaveApiUrl = useCallback(async () => {
    try {
      await setApiBaseUrl(apiUrl);
      await updateApiClientBaseUrl();
      setCurrentApiUrl(apiUrl);
      setShowApiConfig(false);
      Alert.alert(t('common.success'), t('home.apiUrlSaved'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'Failed to save API URL');
    }
  }, [apiUrl, t]);

  const handleResetApiUrl = useCallback(async () => {
    const defaultUrl = getDefaultApiBaseUrl();
    setApiUrl(defaultUrl);
    await setApiBaseUrl('');
    await updateApiClientBaseUrl();
    setCurrentApiUrl(defaultUrl);
    setShowApiConfig(false);
    Alert.alert(t('common.success'), t('home.apiUrlReset'));
  }, [t]);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Settings Button */}
      <View style={styles.settingsButton}>
        <IconButton
          icon="cog"
          size={24}
          iconColor="#6B7280"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineLarge" style={styles.title}>
          {t('auth.appName')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('auth.subtitle')}
        </Text>

        <TextInput
          label={t('auth.email')}
          value={email}
          onChangeText={(text) => { setEmail(text); clearError(); }}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label={t('auth.password')}
          value={password}
          onChangeText={(text) => { setPassword(text); clearError(); }}
          mode="outlined"
          secureTextEntry={!showPassword}
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
          style={styles.input}
        />

        {error && <HelperText type="error" visible>{error}</HelperText>}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || !email || !password}
          style={styles.button}
        >
          {t('auth.login')}
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.link}
        >
          {t('auth.noAccount')}
        </Button>

        {/* API URL Config */}
        <Card style={styles.apiCard}>
          <Card.Content>
            <View style={styles.apiHeader}>
              <View style={styles.apiHeaderLeft}>
                <Text variant="titleSmall">🔌 {t('home.apiUrl')}</Text>
                <Text variant="bodySmall" style={styles.apiCurrentUrl} numberOfLines={1}>
                  {currentApiUrl}
                </Text>
              </View>
              <IconButton
                icon={showApiConfig ? 'chevron-up' : 'chevron-down'}
                size={18}
                onPress={() => setShowApiConfig(!showApiConfig)}
              />
            </View>
            {showApiConfig && (
              <View style={styles.apiConfigContent}>
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
                <View style={styles.apiActions}>
                  <Button mode="outlined" onPress={handleResetApiUrl} compact>
                    {t('home.resetApiUrl')}
                  </Button>
                  <Button mode="contained" onPress={handleSaveApiUrl} compact>
                    {t('common.save')}
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  settingsButton: { position: 'absolute', top: 48, right: 8, zIndex: 10 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#4A90D9', marginBottom: 8 },
  subtitle: { textAlign: 'center', color: '#6B7280', marginBottom: 32 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, paddingVertical: 4 },
  link: { marginTop: 16 },
  apiCard: { marginTop: 24, backgroundColor: '#FFFFFF' },
  apiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  apiHeaderLeft: { flex: 1 },
  apiCurrentUrl: { color: '#6B7280', marginTop: 2 },
  apiConfigContent: { marginTop: 12, gap: 12 },
  apiUrlInput: { backgroundColor: '#FFFFFF' },
  apiActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
