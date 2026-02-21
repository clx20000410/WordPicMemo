import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  AndroidChannel,
} from '@notifee/react-native';
import { REVIEW_INTERVALS } from '@wordpicmemo/shared';

export const REVIEW_REMINDER_CHANNEL_ID = 'review-reminders';
const REVIEW_NOTIFICATION_PREFIX = 'review-';
const IMMEDIATE_FALLBACK_DELAY_MS = 5000;
const ACTIVE_REVIEW_STATUSES = new Set(['pending', 'due', 'overdue']);

export interface PendingReviewSchedule {
  wordId: string;
  stage: number;
  scheduledAt: string | Date;
  status: string;
  word?: string | null;
}

interface NormalizedPendingSchedule {
  id: string;
  wordId: string;
  word?: string;
  stage: number;
  stageLabelZh: string;
  scheduledTime: number;
}

/**
 * Build a deterministic notification ID for a given word + stage.
 */
function buildNotificationId(wordId: string, stage: number): string {
  return `${REVIEW_NOTIFICATION_PREFIX}${wordId}-stage-${stage}`;
}

function isReviewNotificationId(id: string): boolean {
  return id.startsWith(REVIEW_NOTIFICATION_PREFIX);
}

function toTimestamp(dateValue: string | Date): number | null {
  const timestamp = new Date(dateValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

class NotificationService {
  /**
   * Create the Android notification channel (must be called once on app start).
   */
  async initialize(): Promise<void> {
    await notifee.createChannel({
      id: REVIEW_REMINDER_CHANNEL_ID,
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
    const baseTime = toTimestamp(createdAt);
    if (baseTime === null) {
      throw new Error(`Invalid createdAt for notification scheduling: ${String(createdAt)}`);
    }

    const now = Date.now();

    for (const interval of REVIEW_INTERVALS) {
      const scheduledTime = baseTime + interval.delayMs;

      // Skip already-expired time points to avoid firing immediately
      if (scheduledTime <= now) {
        continue;
      }

      await this.scheduleStageNotification({
        wordId,
        word,
        stage: interval.stage,
        stageLabelZh: interval.labelZh,
        scheduledTime,
      });
    }
  }

  /**
   * Sync local trigger notifications with backend pending schedules:
   * - remove stale local review notifications
   * - create missing local notifications for pending schedules
   */
  async syncPendingReviewNotifications(
    schedules: PendingReviewSchedule[],
  ): Promise<void> {
    const now = Date.now();
    const localIds = await this.getScheduledNotificationIds();
    const localReviewIds = localIds.filter(isReviewNotificationId);
    const existingIdSet = new Set(localReviewIds);

    const activeSchedules = schedules.filter((item) => ACTIVE_REVIEW_STATUSES.has(item.status));
    const normalizedSchedules: NormalizedPendingSchedule[] = [];
    for (const item of activeSchedules) {
      const scheduledTime = toTimestamp(item.scheduledAt);
      if (scheduledTime === null) {
        continue;
      }

      const interval = REVIEW_INTERVALS.find((i) => i.stage === item.stage);
      const isFuturePending = item.status === 'pending' && scheduledTime > now;
      normalizedSchedules.push({
        id: buildNotificationId(item.wordId, item.stage),
        wordId: item.wordId,
        word: item.word ?? undefined,
        stage: item.stage,
        stageLabelZh: interval?.labelZh ?? `${item.stage}阶段`,
        scheduledTime: isFuturePending
          ? scheduledTime
          : now + IMMEDIATE_FALLBACK_DELAY_MS,
      });
    }

    const desiredIdSet = new Set(normalizedSchedules.map((item) => item.id));

    for (const localId of localReviewIds) {
      if (!desiredIdSet.has(localId)) {
        await notifee.cancelNotification(localId);
      }
    }

    for (const item of normalizedSchedules) {
      if (existingIdSet.has(item.id)) {
        continue;
      }

      await this.scheduleStageNotification({
        wordId: item.wordId,
        word: item.word,
        stage: item.stage,
        stageLabelZh: item.stageLabelZh,
        scheduledTime: item.scheduledTime,
      });
    }

    const finalIds = await this.getScheduledNotificationIds();
    const finalReviewIds = finalIds.filter(isReviewNotificationId);
    console.log(
      `[notifications] sync done: activeSchedules=${normalizedSchedules.length}, localReviewTriggers=${finalReviewIds.length}`,
    );
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

  private async scheduleStageNotification({
    wordId,
    word,
    stage,
    stageLabelZh,
    scheduledTime,
  }: {
    wordId: string;
    word?: string;
    stage: number;
    stageLabelZh: string;
    scheduledTime: number;
  }): Promise<void> {
    const safeWord = (word ?? '').trim();
    const wordText = safeWord ? `单词 "${safeWord}"` : '单词';

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: scheduledTime,
      alarmManager: { allowWhileIdle: true },
    };
    const notificationPayload = {
      id: buildNotificationId(wordId, stage),
      title: '复习时间到！',
      body: `复习${wordText} - 第${stage}阶段 (${stageLabelZh})`,
      data: {
        wordId,
        stage: String(stage),
        type: 'review_reminder',
      },
      android: {
        channelId: REVIEW_REMINDER_CHANNEL_ID,
        pressAction: { id: 'default' as const },
        smallIcon: 'ic_launcher',
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (error) {
      // Fallback to WorkManager-based trigger when exact alarm is unavailable.
      const fallbackTrigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: scheduledTime,
      };
      await notifee.createTriggerNotification(notificationPayload, fallbackTrigger);
      console.warn('Exact alarm trigger failed, fallback trigger scheduled instead:', error);
    }
  }
}

export const notificationService = new NotificationService();
