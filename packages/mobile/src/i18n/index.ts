import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import zh from './locales/zh';
import en from './locales/en';

const LANGUAGE_KEY = 'app_language';

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

// Restore persisted language preference
AsyncStorage.getItem(LANGUAGE_KEY).then((lang) => {
  if (lang && (lang === 'zh' || lang === 'en')) {
    i18n.changeLanguage(lang);
  }
});

export type SupportedLanguage = 'zh' | 'en';

export const changeLanguage = async (lang: SupportedLanguage) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export default i18n;
