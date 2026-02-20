import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
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
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ title: '单词图忆' }} />
      <HomeStack.Screen name="WordDetail" component={WordDetailScreen} options={{ title: 'Word Detail' }} />
    </HomeStack.Navigator>
  );
}

function ReviewNavigator() {
  return (
    <ReviewStack.Navigator>
      <ReviewStack.Screen name="ReviewList" component={ReviewListScreen} options={{ title: 'Reviews' }} />
      <ReviewStack.Screen name="FlashcardReview" component={FlashcardReviewScreen} options={{ title: 'Review', headerShown: false }} />
    </ReviewStack.Navigator>
  );
}

export default function MainNavigator() {
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
      <Tab.Screen name="Home" component={HomeNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="WordList" component={WordListScreen} options={{ tabBarLabel: 'Words' }} />
      <Tab.Screen name="Review" component={ReviewNavigator} options={{ tabBarLabel: 'Review' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}
