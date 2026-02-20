import { ReviewStage, ReviewStatus } from '../types/review';
import { REVIEW_INTERVALS, TOTAL_REVIEW_STAGES } from '../constants/review-intervals';

// ==========================================
// Review Schedule Calculator
// ==========================================

export interface ScheduleItem {
  stage: ReviewStage;
  scheduledAt: Date;
}

/**
 * Calculate all 8 review schedule timestamps from a base time
 */
export function calculateReviewSchedules(baseTime: Date = new Date()): ScheduleItem[] {
  const base = baseTime.getTime();

  return REVIEW_INTERVALS.map((interval) => ({
    stage: interval.stage,
    scheduledAt: new Date(base + interval.delayMs),
  }));
}

/**
 * Determine if a review is overdue (more than 24 hours past scheduled time)
 */
export function isReviewOverdue(scheduledAt: Date, now: Date = new Date()): boolean {
  const overdueThresholdMs = 24 * 60 * 60 * 1000; // 24 hours
  return now.getTime() - scheduledAt.getTime() > overdueThresholdMs;
}

/**
 * Determine if a review is currently due
 */
export function isReviewDue(scheduledAt: Date, status: ReviewStatus, now: Date = new Date()): boolean {
  return status === 'pending' && now.getTime() >= scheduledAt.getTime();
}

/**
 * Check if all stages are completed for a word
 */
export function isWordFullyReviewed(completedStages: ReviewStage[]): boolean {
  return completedStages.length >= TOTAL_REVIEW_STAGES;
}

/**
 * Get the next stage number after the given stage
 */
export function getNextStage(currentStage: ReviewStage): ReviewStage | null {
  const next = currentStage + 1;
  if (next > TOTAL_REVIEW_STAGES) return null;
  return next as ReviewStage;
}

/**
 * Format remaining time until a review is due
 */
export function formatTimeUntilDue(scheduledAt: Date, now: Date = new Date()): string {
  const diffMs = scheduledAt.getTime() - now.getTime();

  if (diffMs <= 0) return 'Now';

  const minutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
