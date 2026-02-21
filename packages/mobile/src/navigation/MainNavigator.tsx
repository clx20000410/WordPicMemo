import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MainTabParamList, HomeStackParamList, ReviewStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import WordDetailScreen from '../screens/word/WordDetailScreen';
import WordListScreen from '../screens/word/WordListScreen';
import ReviewListScreen from '../screens/review/ReviewListScreen';
import FlashcardReviewScreen from '../screens/review/FlashcardReviewScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ReviewStack = createNativeStackNavigator<ReviewStackParamList>();

function HomeNavigator() {
  const { t } = useTranslation();
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ title: t('auth.appName') }} />
      <HomeStack.Screen name="WordDetail" component={WordDetailScreen} options={{ title: t('nav.words') }} />
    </HomeStack.Navigator>
  );
}

function ReviewNavigator() {
  const { t } = useTranslation();
  return (
    <ReviewStack.Navigator>
      <ReviewStack.Screen name="ReviewList" component={ReviewListScreen} options={{ title: t('nav.review') }} />
      <ReviewStack.Screen name="FlashcardReview" component={FlashcardReviewScreen} options={{ title: t('nav.review'), headerShown: false }} />
    </ReviewStack.Navigator>
  );
}

export default function MainNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: '🏠',
            WordList: '📖',
            Review: '🧠',
            Settings: '⚙️',
          };
          return <Text style={{ fontSize: size - 4 }}>{icons[route.name] || '●'}</Text>;
        },
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="WordList" component={WordListScreen} options={{ tabBarLabel: t('nav.records') }} />
      <Tab.Screen name="Review" component={ReviewNavigator} options={{ tabBarLabel: t('nav.review') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('nav.settings') }} />
    </Tab.Navigator>
  );
}
