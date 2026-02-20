import { create } from 'zustand';
import { AIConfiguration, CreateAIConfigDto, UpdateAIConfigDto, AITestResult } from '@wordpicmemo/shared';
import { aiConfigService } from '../services';

interface SettingsState {
  aiConfigs: AIConfiguration[];
  isLoading: boolean;
  testResult: AITestResult | null;
  error: string | null;

  fetchConfigs: () => Promise<void>;
  createConfig: (dto: CreateAIConfigDto) => Promise<void>;
  updateConfig: (id: string, dto: UpdateAIConfigDto) => Promise<void>;
  testConfig: (id: string) => Promise<AITestResult>;
  clearTestResult: () => void;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  aiConfigs: [],
  isLoading: false,
  testResult: null,
  error: null,

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
}));
