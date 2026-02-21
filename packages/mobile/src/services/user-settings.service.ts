import { apiClient } from './api';
import { UserSettings, UpdateUserSettingsDto } from '@wordpicmemo/shared';

export const userSettingsService = {
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await apiClient.get('/users/settings');
    return data;
  },

  updateSettings: async (dto: UpdateUserSettingsDto): Promise<UserSettings> => {
    const { data } = await apiClient.patch('/users/settings', dto);
    return data;
  },
};
