import { apiClient } from './api';
import {
  Word,
  CreateWordDto,
  CreateNoteDto,
  WordListQuery,
  PaginatedResponse,
} from '@wordpicmemo/shared';

export const wordService = {
  createWord: async (dto: CreateWordDto): Promise<Word> => {
    const { data } = await apiClient.post('/words', dto);
    return data;
  },

  createNote: async (dto: CreateNoteDto): Promise<Word> => {
    const { data } = await apiClient.post('/words/notes', dto);
    return data;
  },

  getWords: async (query: WordListQuery): Promise<PaginatedResponse<Word>> => {
    const { data } = await apiClient.get('/words', { params: query });
    return data;
  },

  getWordById: async (id: string): Promise<Word> => {
    const { data } = await apiClient.get(`/words/${id}`);
    return data;
  },

  regenerateExplanation: async (id: string): Promise<void> => {
    await apiClient.post(`/words/${id}/regenerate`);
  },

  regenerateImage: async (id: string): Promise<void> => {
    await apiClient.post(`/words/${id}/regenerate-image`);
  },

  deleteWord: async (id: string): Promise<void> => {
    await apiClient.delete(`/words/${id}`);
  },
};
