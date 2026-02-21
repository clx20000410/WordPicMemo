import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuthStore } from '../../store';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();

  const handleRegister = async () => {
    try {
      await register(email, password, nickname);
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          {t('auth.createAccount')}
        </Text>

        <TextInput
          label={t('auth.nickname')}
          value={nickname}
          onChangeText={(text) => { setNickname(text); clearError(); }}
          mode="outlined"
          style={styles.input}
        />

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
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading || !email || !password || !nickname}
          style={styles.button}
        >
          {t('auth.register')}
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.link}
        >
          {t('auth.hasAccount')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#4A90D9', marginBottom: 32 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, paddingVertical: 4 },
  link: { marginTop: 16 },
});
