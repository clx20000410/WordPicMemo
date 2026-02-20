import { create } from 'zustand';
import { DueReviewItem, ReviewSummary } from '@wordpicmemo/shared';
import { reviewService, notificationService } from '../services';

interface ReviewState {
  dueReviews: DueReviewItem[];
  summary: ReviewSummary | null;
  currentReviewIndex: number;
  isLoading: boolean;
  error: string | null;

  fetchDueReviews: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  completeReview: (reviewId: string, remembered: boolean, confidence: number) => Promise<void>;
  nextReview: () => void;
  resetReviewSession: () => void;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  dueReviews: [],
  summary: null,
  currentReviewIndex: 0,
  isLoading: false,
  error: null,

  fetchDueReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await reviewService.getDueReviews();
      set({ dueReviews: reviews, currentReviewIndex: 0, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch reviews', isLoading: false });
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
      set((state) => ({
        dueReviews: state.dueReviews.filter((r) => r.review.id !== reviewId),
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

  nextReview: () => {
    set((state) => ({
      currentReviewIndex: Math.min(state.currentReviewIndex + 1, state.dueReviews.length - 1),
    }));
  },

  resetReviewSession: () => set({ currentReviewIndex: 0 }),
  clearError: () => set({ error: null }),
}));
