import { create } from 'zustand';
import { Word, PaginatedResponse } from '@wordpicmemo/shared';
import { wordService, notificationService, reviewService } from '../services';

interface WordState {
  words: Word[];
  currentWord: Word | null;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  fetchWords: (page?: number, search?: string, date?: string) => Promise<void>;
  fetchWordById: (id: string) => Promise<void>;
  createWord: (word: string, language?: string) => Promise<Word>;
  createNote: (title: string, content: string, imageDataUrl?: string) => Promise<Word>;
  deleteWord: (id: string) => Promise<void>;
  regenerateExplanation: (id: string) => Promise<void>;
  regenerateImage: (id: string) => Promise<void>;
  clearCurrentWord: () => void;
  clearError: () => void;
}

export const useWordStore = create<WordState>((set, get) => ({
  words: [],
  currentWord: null,
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,
  isCreating: false,
  error: null,

  fetchWords: async (page = 1, search, date) => {
    set({ isLoading: true, error: null });
    try {
      const result = await wordService.getWords({ page, limit: 20, search, date });
      set({
        words: page === 1 ? result.items : [...get().words, ...result.items],
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch words', isLoading: false });
    }
  },

  fetchWordById: async (id) => {
    // Only show loading spinner on initial load, not during polling refresh
    const isInitialLoad = !get().currentWord || get().currentWord!.id !== id;
    if (isInitialLoad) {
      set({ isLoading: true, error: null });
    }
    try {
      const word = await wordService.getWordById(id);
      set({ currentWord: word, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch word', isLoading: false });
    }
  },

  createWord: async (word, language) => {
    set({ isCreating: true, error: null });
    try {
      const newWord = await wordService.createWord({ word, language: language as any });
      set((state) => ({
        words: [newWord, ...state.words],
        total: state.total + 1,
        isCreating: false,
      }));
      // Sync from backend schedule source and wait for local triggers to be persisted.
      await syncReviewNotifications();
      return newWord;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create word', isCreating: false });
      throw error;
    }
  },

  createNote: async (title, content, imageDataUrl) => {
    set({ isCreating: true, error: null });
    try {
      const newNote = await wordService.createNote({ title, content, imageDataUrl });
      set((state) => ({
        words: [newNote, ...state.words],
        total: state.total + 1,
        isCreating: false,
      }));
      await syncReviewNotifications();
      return newNote;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create note', isCreating: false });
      throw error;
    }
  },

  deleteWord: async (id) => {
    try {
      await wordService.deleteWord(id);
      set((state) => ({
        words: state.words.filter((w) => w.id !== id),
        total: Math.max(0, state.total - 1),
      }));
      // Cancel all notifications for this word
      notificationService
        .cancelNotificationsForWord(id)
        .catch((err) => console.warn('Failed to cancel notifications:', err));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete word' });
      throw error;
    }
  },

  regenerateExplanation: async (id) => {
    try {
      await wordService.regenerateExplanation(id);
      // Refresh the word
      const word = await wordService.getWordById(id);
      set({ currentWord: word });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to regenerate' });
    }
  },

  regenerateImage: async (id) => {
    try {
      await wordService.regenerateImage(id);
      const word = await wordService.getWordById(id);
      set({ currentWord: word });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to regenerate image' });
    }
  },

  clearCurrentWord: () => set({ currentWord: null }),
  clearError: () => set({ error: null }),
}));

async function syncReviewNotifications(): Promise<void> {
  try {
    const schedules = await reviewService.getPendingSchedules();
    await notificationService.syncPendingReviewNotifications(schedules);
  } catch (err) {
    console.warn('Failed to sync scheduled notifications after create:', err);
  }
}
