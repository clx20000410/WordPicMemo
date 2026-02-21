import { create } from 'zustand';
import { DueReviewItem, ReviewSummary, ReviewListStatus } from '@wordpicmemo/shared';
import { reviewService, notificationService } from '../services';

interface ReviewState {
  dueReviews: DueReviewItem[];
  reviewedReviews: DueReviewItem[];
  summary: ReviewSummary | null;
  currentReviewIndex: number;
  isLoading: boolean;
  error: string | null;

  fetchDueReviews: () => Promise<void>;
  fetchReviewSchedules: (status: ReviewListStatus, date?: string) => Promise<DueReviewItem[]>;
  fetchSummary: () => Promise<void>;
  completeReview: (reviewId: string, remembered: boolean, confidence: number) => Promise<void>;
  markReviewViewed: (reviewId: string) => Promise<void>;
  nextReview: () => void;
  resetReviewSession: () => void;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  dueReviews: [],
  reviewedReviews: [],
  summary: null,
  currentReviewIndex: 0,
  isLoading: false,
  error: null,

  fetchDueReviews: async () => {
    await get().fetchReviewSchedules('unreviewed');
  },

  fetchReviewSchedules: async (status, date) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewService.getReviewSchedules(status, date);
      if (status === 'reviewed') {
        set({ reviewedReviews: reviews, isLoading: false });
      } else {
        set({ dueReviews: reviews, currentReviewIndex: 0, isLoading: false });
      }
      return reviews;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch reviews', isLoading: false });
      return [];
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await reviewService.getTodaySummary();
      set({ summary });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch summary' });
    }
  },

  completeReview: async (reviewId, remembered, confidence) => {
    try {
      await reviewService.completeReview(reviewId, { remembered, confidence });
      // Find the completed review before removing it from state
      const completedReview = get().dueReviews.find((r) => r.review.id === reviewId);
      const completedAt = new Date();
      set((state) => ({
        dueReviews: state.dueReviews.filter((r) => r.review.id !== reviewId),
        reviewedReviews: completedReview
          ? [
              {
                ...completedReview,
                review: {
                  ...completedReview.review,
                  status: 'completed',
                  completedAt,
                  remembered,
                  confidence,
                },
              },
              ...state.reviewedReviews,
            ]
          : state.reviewedReviews,
        summary: state.summary
          ? {
              ...state.summary,
              totalDue: state.summary.totalDue - 1,
              completedToday: state.summary.completedToday + 1,
            }
          : null,
      }));
      // Cancel the corresponding notification (fire-and-forget)
      if (completedReview) {
        notificationService
          .cancelNotificationForStage(completedReview.review.wordId, completedReview.review.stage)
          .catch((err) => console.warn('Failed to cancel notification:', err));
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to complete review' });
      throw error;
    }
  },

  markReviewViewed: async (reviewId) => {
    await get().completeReview(reviewId, true, 3);
  },

  nextReview: () => {
    set((state) => ({
      currentReviewIndex: Math.min(state.currentReviewIndex + 1, state.dueReviews.length - 1),
    }));
  },

  resetReviewSession: () => set({ currentReviewIndex: 0 }),
  clearError: () => set({ error: null }),
}));
