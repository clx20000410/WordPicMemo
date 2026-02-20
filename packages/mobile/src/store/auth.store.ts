import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@wordpicmemo/shared';
import { authService, notificationService } from '../services';
import { setOnAuthLost } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Register auth-lost callback so the API interceptor can trigger logout
  setOnAuthLost(() => {
    set({ user: null, isAuthenticated: false });
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.login({ email, password });
        await AsyncStorage.setItem('accessToken', result.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', result.tokens.refreshToken);
        set({ user: result.user as any, isAuthenticated: true, isLoading: false });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    register: async (email, password, nickname) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.register({ email, password, nickname });
        await AsyncStorage.setItem('accessToken', result.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', result.tokens.refreshToken);
        set({ user: result.user as any, isAuthenticated: true, isLoading: false });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Registration failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      // Cancel all pending review notifications on logout
      notificationService.cancelAllNotifications().catch((err) =>
        console.warn('Failed to cancel notifications on logout:', err),
      );
      set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        set({ isAuthenticated: false });
        return;
      }

      try {
        // Try to fetch user profile with existing token
        const user = await authService.getMe();
        set({ user: user as any, isAuthenticated: true });
      } catch {
        // Access token expired — the interceptor will auto-refresh.
        // If refresh also fails, onAuthLost callback clears auth state.
        // Check if tokens were cleared by the interceptor
        const tokenStillExists = await AsyncStorage.getItem('accessToken');
        if (tokenStillExists) {
          // Token was refreshed successfully, try again
          try {
            const user = await authService.getMe();
            set({ user: user as any, isAuthenticated: true });
          } catch {
            // Still failing — force logout
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            set({ user: null, isAuthenticated: false });
          }
        } else {
          set({ user: null, isAuthenticated: false });
        }
      }
    },

    clearError: () => set({ error: null }),
  };
});
