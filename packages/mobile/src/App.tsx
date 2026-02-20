import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType, Event as NotifeeEvent } from '@notifee/react-native';
import { lightTheme } from './theme';
import { RootNavigator, RootStackParamList } from './navigation';
import { useAuthStore } from './store';
import { notificationService, reviewService } from './services';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Initial auth check
  useEffect(() => {
    checkAuth().finally(() => setIsReady(true));
  }, []);

  // Initialize notification channel on mount
  useEffect(() => {
    notificationService.initialize().catch((err) =>
      console.warn('Failed to initialize notifications:', err),
    );
  }, []);

  // When authenticated: request permission + sync notifications with backend
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    (async () => {
      try {
        await notificationService.requestPermission();

        // Sync: cancel local notifications for reviews that are no longer pending
        const [localIds, pendingSchedules] = await Promise.all([
          notificationService.getScheduledNotificationIds(),
          reviewService.getPendingSchedules(),
        ]);

        // Build a set of notification IDs that should still exist
        const validIds = new Set(
          pendingSchedules.map(
            (s) => `review-${s.wordId}-stage-${s.stage}`,
          ),
        );

        // Cancel any local notification that no longer has a pending backend schedule
        for (const localId of localIds) {
          if (localId.startsWith('review-') && !validIds.has(localId)) {
            await notifee.cancelNotification(localId);
          }
        }
      } catch (err) {
        console.warn('Failed to sync notifications:', err);
      }
    })();
  }, [isAuthenticated]);

  // Handle foreground notification press — navigate to Review tab
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }: NotifeeEvent) => {
      if (type === EventType.PRESS && detail.notification?.data?.type === 'review_reminder') {
        // Navigate to Review tab when notification is tapped
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('Main' as any, {
            screen: 'Review',
          });
        }
      }
    });
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={lightTheme}>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFF' },
});
