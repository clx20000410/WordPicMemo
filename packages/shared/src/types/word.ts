// ==========================================
// Word & Explanation Types
// ==========================================

export type WordLanguage = 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'note';

export type ImageStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type ExplanationStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface WordBreakdownItem {
  part: string;
  meaning: string;
  origin?: string;
}

export interface ExampleSentence {
  en: string;
  zh: string;
}

export interface WordExplanation {
  id: string;
  wordId: string;
  pronunciation: string;
  wordBreakdown: WordBreakdownItem[];
  mnemonicPhrase: string;
  coreDefinition: string;
  exampleSentences: ExampleSentence[];
  memoryScene: string;
  imagePrompt: string;
  imageUrl: string | null;
  imageStatus: ImageStatus;
  explanationStatus: ExplanationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Word {
  id: string;
  userId: string;
  word: string;
  language: WordLanguage;
  explanation?: WordExplanation;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWordDto {
  word: string;
  language?: WordLanguage;
}

export interface CreateNoteDto {
  content: string;
  imageDataUrl?: string;
}

export interface WordListQuery {
  page?: number;
  limit?: number;
  search?: string;
  language?: WordLanguage;
  date?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
