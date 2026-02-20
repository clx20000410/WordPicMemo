import { apiClient } from './api';
import { CreateUserDto, LoginDto, AuthResponse } from '@wordpicmemo/shared';

export const authService = {
  register: async (dto: CreateUserDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', dto);
    return data;
  },

  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', dto);
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    // Backend returns { accessToken, refreshToken } directly
    return data;
  },

  getMe: async (): Promise<{ id: string; email: string; nickname: string; timezone: string; createdAt: string }> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
