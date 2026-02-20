export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  WordList: undefined;
  Review: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  WordDetail: { wordId: string };
};

export type ReviewStackParamList = {
  ReviewList: undefined;
  FlashcardReview: undefined;
};
