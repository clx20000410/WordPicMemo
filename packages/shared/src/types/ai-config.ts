// ==========================================
// AI Configuration Types
// ==========================================

export type AIProvider = 'openai' | 'claude' | 'zhipu' | 'doubao' | 'custom';

export type AIPurpose = 'text' | 'image';

export type ResponseFormat = 'openai' | 'openai-stream' | 'claude' | 'gemini' | 'dall-e' | 'doubao';

export interface AIConfiguration {
  id: string;
  userId: string;
  purpose: AIPurpose;
  provider: AIProvider;
  responseFormat: ResponseFormat;
  apiEndpoint: string;
  apiKey: string; // masked in responses
  modelName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAIConfigDto {
  purpose: AIPurpose;
  provider?: AIProvider;
  responseFormat: ResponseFormat;
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
}

export interface UpdateAIConfigDto {
  apiEndpoint?: string;
  apiKey?: string;
  modelName?: string;
  responseFormat?: ResponseFormat;
  isActive?: boolean;
}

export interface AITestResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

// AI generation result types
export interface WordExplanationResult {
  pronunciation: string;
  wordBreakdown: { part: string; meaning: string; origin?: string }[];
  mnemonicPhrase: string;
  coreDefinition: string;
  exampleSentences: { en: string; zh: string }[];
  memoryScene: string;
  imagePrompt: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

// ==========================================
// User Settings Types
// ==========================================

export const DEFAULT_IMAGE_PROMPT_TEMPLATE =
  'Create a vivid, colorful illustration in a whimsical cartoon style that depicts the following scene related to the English word.';

export interface UserSettings {
  imagePromptTemplate: string;
}

export interface UpdateUserSettingsDto {
  imagePromptTemplate?: string;
}
