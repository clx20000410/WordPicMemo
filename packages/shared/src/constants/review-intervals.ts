import { ReviewStage } from '../types/review';

// ==========================================
// Ebbinghaus Forgetting Curve Intervals
// ==========================================

export interface ReviewInterval {
  stage: ReviewStage;
  label: string;
  labelZh: string;
  delayMs: number;
}

export const REVIEW_INTERVALS: readonly ReviewInterval[] = [
  { stage: 1, label: '5 minutes', labelZh: '5分钟', delayMs: 5 * 60 * 1000 },
  { stage: 2, label: '30 minutes', labelZh: '30分钟', delayMs: 30 * 60 * 1000 },
  { stage: 3, label: '12 hours', labelZh: '12小时', delayMs: 12 * 60 * 60 * 1000 },
  { stage: 4, label: '1 day', labelZh: '1天', delayMs: 24 * 60 * 60 * 1000 },
  { stage: 5, label: '2 days', labelZh: '2天', delayMs: 2 * 24 * 60 * 60 * 1000 },
  { stage: 6, label: '4 days', labelZh: '4天', delayMs: 4 * 24 * 60 * 60 * 1000 },
  { stage: 7, label: '7 days', labelZh: '7天', delayMs: 7 * 24 * 60 * 60 * 1000 },
  { stage: 8, label: '15 days', labelZh: '15天', delayMs: 15 * 24 * 60 * 60 * 1000 },
] as const;

export const TOTAL_REVIEW_STAGES = 8;

/**
 * Get review interval config by stage number
 */
export function getReviewInterval(stage: ReviewStage): ReviewInterval {
  const interval = REVIEW_INTERVALS.find((i) => i.stage === stage);
  if (!interval) {
    throw new Error(`Invalid review stage: ${stage}`);
  }
  return interval;
}
