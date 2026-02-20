export interface WordExplanationRequest {
  word: string;
  language: string;
}

export interface WordExplanationResult {
  pronunciation: string;
  wordBreakdown: { part: string; meaning: string; origin?: string }[];
  mnemonicPhrase: string;
  coreDefinition: string;
  exampleSentences: { en: string; zh: string }[];
  memoryScene: string;
  imagePrompt: string;
}

export interface ITextGenerator {
  generateExplanation(
    request: WordExplanationRequest,
  ): Promise<WordExplanationResult>;
  testConnection(): Promise<boolean>;
}
