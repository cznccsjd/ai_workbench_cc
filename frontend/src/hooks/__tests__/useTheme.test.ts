/**
 * useTheme Hook 测试
 */

import { renderHook } from '@testing-library/react';

// Mock the theme store
const mockThemeStore = {
  currentTheme: 'apple-minimal' as const,
  isDark: false,
  availableThemes: [],
  setTheme: jest.fn(),
  toggleDarkMode: jest.fn(),
  getCurrentTheme: jest.fn(() => ({
    id: 'apple-minimal',
    name: 'Apple Minimal',
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#007AFF',
      secondary: '#F2F2F7',
    }
  })),
  initializeTheme: jest.fn(),
};

jest.mock('@/stores/themeStore', () => ({
  useThemeStore: () => mockThemeStore,
}));

import { useTheme } from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return current theme information', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.currentTheme).toBe('apple-minimal');
    expect(result.current.isDark).toBe(false);
    expect(typeof result.current.setTheme).toBe('function');
    expect(typeof result.current.toggleDarkMode).toBe('function');
  });

  it('should return theme styles', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.currentThemeConfig).toBeDefined();
    expect(result.current.currentThemeConfig.id).toBe('apple-minimal');
    expect(result.current.currentThemeConfig.name).toBe('Apple Minimal');
  });

  it('should call theme store methods', () => {
    const { result } = renderHook(() => useTheme());

    result.current.setTheme('cyber-dark');
    expect(mockThemeStore.setTheme).toHaveBeenCalledWith('cyber-dark');

    result.current.toggleDarkMode();
    expect(mockThemeStore.toggleDarkMode).toHaveBeenCalled();
  });

  it('should initialize theme on mount', () => {
    renderHook(() => useTheme());
    expect(mockThemeStore.initializeTheme).toHaveBeenCalled();
  });

  it('should return available themes', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.availableThemes).toEqual([]);
  });
});