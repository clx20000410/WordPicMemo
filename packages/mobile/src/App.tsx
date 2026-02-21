import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { AndroidNotificationSetting, EventType, Event as NotifeeEvent } from '@notifee/react-native';
import { lightTheme } from './theme';
import { RootNavigator, RootStackParamList } from './navigation';
import { useAuthStore } from './store';
import { notificationService, reviewService, REVIEW_REMINDER_CHANNEL_ID, updateApiClientBaseUrl } from './services';
import './i18n';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const reminderNavigationRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigateToFlashcardReview = (payload?: { wordId?: unknown; stage?: unknown }) => {
    const wordId = typeof payload?.wordId === 'string' ? payload.wordId : undefined;
    const parsedStage = Number(payload?.stage);
    const stage = Number.isFinite(parsedStage) ? parsedStage : undefined;

    const navigate = () => {
      if (!navigationRef.current?.isReady()) {
        return false;
      }
      navigationRef.current.navigate('Main' as any, {
        screen: 'Review',
        params: {
          screen: 'FlashcardReview',
          params: {
            wordId,
            stage,
          },
        },
      });
      return true;
    };

    if (navigate()) {
      return;
    }

    if (reminderNavigationRetryRef.current) {
      clearInterval(reminderNavigationRetryRef.current);
    }

    let attempts = 0;
    reminderNavigationRetryRef.current = setInterval(() => {
      attempts += 1;
      if (navigate() || attempts >= 20) {
        if (reminderNavigationRetryRef.current) {
          clearInterval(reminderNavigationRetryRef.current);
          reminderNavigationRetryRef.current = null;
        }
      }
    }, 200);
  };

  // Initialize API base URL from local storage before any network requests
  useEffect(() => {
    const initApiUrl = async () => {
      try {
        await updateApiClientBaseUrl();
      } catch (err) {
        console.warn('Failed to initialize API URL:', err);
      }
    };
    initApiUrl();
  }, []);

  // Initial auth check
  useEffect(() => {
    checkAuth().finally(() => setIsReady(true));
  }, [checkAuth]);

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
        const hasPermission = await notificationService.requestPermission();
        if (!hasPermission) {
          console.warn('Notification permission denied. Reminders are synced but may not be shown.');
          await notifee.openNotificationSettings().catch((err) =>
            console.warn('Failed to open app notification settings:', err),
          );
        }

        const [settings, isChannelBlocked] = await Promise.all([
          notifee.getNotificationSettings(),
          notifee.isChannelBlocked(REVIEW_REMINDER_CHANNEL_ID),
        ]);

        if (settings.android?.alarm === AndroidNotificationSetting.DISABLED) {
          console.warn('Exact alarm permission is disabled. Opening alarm permission settings.');
          await notifee.openAlarmPermissionSettings().catch((err) =>
            console.warn('Failed to open alarm permission settings:', err),
          );
        }

        if (isChannelBlocked) {
          console.warn('Reminder notification channel is blocked. Opening notification settings.');
          await notifee.openNotificationSettings(REVIEW_REMINDER_CHANNEL_ID).catch((err) =>
            console.warn('Failed to open notification settings:', err),
          );
        }

        const pendingSchedules = await reviewService.getPendingSchedules();
        await notificationService.syncPendingReviewNotifications(pendingSchedules);
      } catch (err) {
        console.warn('Failed to sync notifications:', err);
      }
    })();
  }, [isAuthenticated]);

  // Handle foreground notification press — navigate to Review tab
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }: NotifeeEvent) => {
      if (type === EventType.PRESS && detail.notification?.data?.type === 'review_reminder') {
        navigateToFlashcardReview(detail.notification?.data as any);
      }
    });
  }, []);

  // Handle app-open from notification in background/killed state.
  useEffect(() => {
    notifee
      .getInitialNotification()
      .then((initial) => {
        if (initial?.notification?.data?.type === 'review_reminder') {
          navigateToFlashcardReview(initial.notification?.data as any);
        }
      })
      .catch((err) => console.warn('Failed to get initial notification:', err));

    return () => {
      if (reminderNavigationRetryRef.current) {
        clearInterval(reminderNavigationRetryRef.current);
        reminderNavigationRetryRef.current = null;
      }
    };
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
