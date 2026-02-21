// ==========================================
// Review Schedule Types
// ==========================================

export type ReviewStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ReviewStatus = 'pending' | 'due' | 'completed' | 'overdue' | 'skipped';

export type ReviewListStatus = 'unreviewed' | 'reviewed';

export interface ReviewSchedule {
  id: string;
  wordId: string;
  userId: string;
  stage: ReviewStage;
  scheduledAt: Date;
  completedAt: Date | null;
  status: ReviewStatus;
  remembered: boolean | null;
  confidence: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompleteReviewDto {
  remembered: boolean;
  confidence: number; // 1-5
}

export interface ReviewListQuery {
  status?: ReviewListStatus;
  date?: string;
}

export interface ReviewSummary {
  totalDue: number;
  completedToday: number;
  overdueCount: number;
  upcomingToday: number;
}

export interface DueReviewItem {
  review: ReviewSchedule;
  word: {
    id: string;
    word: string;
    language: string;
  };
  explanation: {
    pronunciation: string;
    coreDefinition: string;
    mnemonicPhrase: string;
    memoryScene: string;
    imageUrl: string | null;
  } | null;
}
