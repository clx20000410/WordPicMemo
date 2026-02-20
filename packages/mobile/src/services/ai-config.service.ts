import { apiClient } from './api';
import { AIConfiguration, CreateAIConfigDto, UpdateAIConfigDto, AITestResult } from '@wordpicmemo/shared';

export const aiConfigService = {
  getAll: async (): Promise<AIConfiguration[]> => {
    const { data } = await apiClient.get('/ai-configs');
    return data;
  },

  create: async (dto: CreateAIConfigDto): Promise<AIConfiguration> => {
    const { data } = await apiClient.post('/ai-configs', dto);
    return data;
  },

  update: async (id: string, dto: UpdateAIConfigDto): Promise<AIConfiguration> => {
    const { data } = await apiClient.patch(`/ai-configs/${id}`, dto);
    return data;
  },

  test: async (id: string): Promise<AITestResult> => {
    const { data } = await apiClient.post(`/ai-configs/${id}/test`);
    return data;
  },
};
