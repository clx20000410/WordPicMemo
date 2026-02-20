import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightColors = {
  primary: '#4A90D9',
  primaryContainer: '#D6E4FF',
  secondary: '#6C63FF',
  secondaryContainer: '#E8E5FF',
  tertiary: '#FF6B6B',
  tertiaryContainer: '#FFE0E0',
  background: '#FAFBFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F8',
  error: '#DC3545',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onBackground: '#1A1A2E',
  onSurface: '#1A1A2E',
  onSurfaceVariant: '#6B7280',
  outline: '#D1D5DB',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7AB5FF',
    primaryContainer: '#1E3A5F',
    secondary: '#9B94FF',
    secondaryContainer: '#3D3680',
    background: '#0F1123',
    surface: '#1A1B2E',
    surfaceVariant: '#252640',
    onPrimary: '#FFFFFF',
    onBackground: '#E8E9F0',
    onSurface: '#E8E9F0',
    onSurfaceVariant: '#9CA3AF',
    outline: '#4B5563',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
