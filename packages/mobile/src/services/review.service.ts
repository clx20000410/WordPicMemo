import { apiClient } from './api';
import { DueReviewItem, ReviewSummary, CompleteReviewDto, ReviewSchedule } from '@wordpicmemo/shared';

export interface PendingScheduleItem {
  id: string;
  wordId: string;
  stage: number;
  scheduledAt: string;
  status: string;
}

export const reviewService = {
  getDueReviews: async (): Promise<DueReviewItem[]> => {
    const { data } = await apiClient.get('/reviews/due');
    return data;
  },

  getTodaySummary: async (): Promise<ReviewSummary> => {
    const { data } = await apiClient.get('/reviews/today');
    return data;
  },

  completeReview: async (reviewId: string, dto: CompleteReviewDto): Promise<ReviewSchedule> => {
    const { data } = await apiClient.post(`/reviews/${reviewId}/complete`, dto);
    return data;
  },

  getPendingSchedules: async (): Promise<PendingScheduleItem[]> => {
    const { data } = await apiClient.get('/reviews/pending-schedules');
    return data;
  },
};
