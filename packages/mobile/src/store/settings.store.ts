import { create } from 'zustand';
import { AIConfiguration, CreateAIConfigDto, UpdateAIConfigDto, AITestResult, DEFAULT_IMAGE_PROMPT_TEMPLATE } from '@wordpicmemo/shared';
import { aiConfigService } from '../services';
import { userSettingsService } from '../services/user-settings.service';

interface SettingsState {
  aiConfigs: AIConfiguration[];
  isLoading: boolean;
  testResult: AITestResult | null;
  error: string | null;
  imagePromptTemplate: string;
  isSavingPrompt: boolean;

  fetchConfigs: () => Promise<void>;
  createConfig: (dto: CreateAIConfigDto) => Promise<void>;
  updateConfig: (id: string, dto: UpdateAIConfigDto) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  testConfig: (id: string) => Promise<AITestResult>;
  clearTestResult: () => void;
  clearError: () => void;
  fetchImagePrompt: () => Promise<void>;
  updateImagePrompt: (template: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  aiConfigs: [],
  isLoading: false,
  testResult: null,
  error: null,
  imagePromptTemplate: DEFAULT_IMAGE_PROMPT_TEMPLATE,
  isSavingPrompt: false,

  fetchConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      const configs = await aiConfigService.getAll();
      set({ aiConfigs: configs, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch configs', isLoading: false });
    }
  },

  createConfig: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const config = await aiConfigService.create(dto);
      set((state) => ({ aiConfigs: [...state.aiConfigs, config], isLoading: false }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create config', isLoading: false });
      throw error;
    }
  },

  updateConfig: async (id, dto) => {
    try {
      const updated = await aiConfigService.update(id, dto);
      set((state) => ({
        aiConfigs: state.aiConfigs.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update config' });
      throw error;
    }
  },

  deleteConfig: async (id) => {
    try {
      await aiConfigService.delete(id);
      set((state) => ({
        aiConfigs: state.aiConfigs.filter((c) => c.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete config' });
      throw error;
    }
  },

  testConfig: async (id) => {
    set({ testResult: null });
    try {
      const result = await aiConfigService.test(id);
      set({ testResult: result });
      return result;
    } catch (error: any) {
      const result: AITestResult = { success: false, message: error.message, latencyMs: 0 };
      set({ testResult: result });
      return result;
    }
  },

  clearTestResult: () => set({ testResult: null }),
  clearError: () => set({ error: null }),

  fetchImagePrompt: async () => {
    try {
      const settings = await userSettingsService.getSettings();
      set({ imagePromptTemplate: settings.imagePromptTemplate });
    } catch (error: any) {
      // Silently fall back to default
    }
  },

  updateImagePrompt: async (template) => {
    set({ isSavingPrompt: true, error: null });
    try {
      const settings = await userSettingsService.updateSettings({ imagePromptTemplate: template });
      set({ imagePromptTemplate: settings.imagePromptTemplate, isSavingPrompt: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to save prompt', isSavingPrompt: false });
      throw error;
    }
  },
}));
