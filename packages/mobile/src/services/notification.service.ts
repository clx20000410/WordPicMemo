import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  AndroidChannel,
} from '@notifee/react-native';
import { REVIEW_INTERVALS } from '@wordpicmemo/shared';

const CHANNEL_ID = 'review-reminders';

/**
 * Build a deterministic notification ID for a given word + stage.
 */
function buildNotificationId(wordId: string, stage: number): string {
  return `review-${wordId}-stage-${stage}`;
}

class NotificationService {
  /**
   * Create the Android notification channel (must be called once on app start).
   */
  async initialize(): Promise<void> {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Review Reminders',
      description: 'Ebbinghaus spaced-repetition review reminders',
      importance: AndroidImportance.HIGH,
    } as AndroidChannel);
  }

  /**
   * Request POST_NOTIFICATIONS permission (Android 13+).
   * Returns true if permission was granted.
   */
  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    // authorizationStatus: 1 = AUTHORIZED, 2 = PROVISIONAL
    return (
      settings.authorizationStatus === 1 ||
      settings.authorizationStatus === 2
    );
  }

  /**
   * Schedule all 8 review-stage notifications for a newly created word.
   * Skips stages whose scheduled time has already passed.
   */
  async scheduleReviewNotifications(
    wordId: string,
    word: string,
    createdAt: string | Date,
  ): Promise<void> {
    const baseTime = new Date(createdAt).getTime();
    const now = Date.now();

    for (const interval of REVIEW_INTERVALS) {
      const scheduledTime = baseTime + interval.delayMs;

      // Skip already-expired time points to avoid firing immediately
      if (scheduledTime <= now) {
        continue;
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: scheduledTime,
      };

      await notifee.createTriggerNotification(
        {
          id: buildNotificationId(wordId, interval.stage),
          title: '复习时间到！',
          body: `复习单词 "${word}" - 第${interval.stage}阶段 (${interval.labelZh})`,
          data: {
            wordId,
            stage: String(interval.stage),
            type: 'review_reminder',
          },
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher',
          },
        },
        trigger,
      );
    }
  }

  /**
   * Cancel the notification for a specific word + stage.
   */
  async cancelNotificationForStage(
    wordId: string,
    stage: number,
  ): Promise<void> {
    await notifee.cancelNotification(buildNotificationId(wordId, stage));
  }

  /**
   * Cancel all 8 stage notifications for a specific word.
   */
  async cancelNotificationsForWord(wordId: string): Promise<void> {
    for (let stage = 1; stage <= 8; stage++) {
      await notifee.cancelNotification(buildNotificationId(wordId, stage));
    }
  }

  /**
   * Cancel every pending notification (used on logout).
   */
  async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
  }

  /**
   * Get all currently scheduled trigger notification IDs.
   */
  async getScheduledNotificationIds(): Promise<string[]> {
    return notifee.getTriggerNotificationIds();
  }
}

export const notificationService = new NotificationService();
