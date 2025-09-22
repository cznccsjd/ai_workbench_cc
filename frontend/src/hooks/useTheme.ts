/**
 * 主题Hook - 简化主题系统的使用
 */

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { ThemeId, ThemeConfig } from '@/types/theme';

export interface UseThemeReturn {
  // 当前主题信息
  currentTheme: ThemeId;
  currentThemeConfig: ThemeConfig;
  isDark: boolean;

  // 主题操作方法
  setTheme: (themeId: ThemeId) => void;
  toggleDarkMode: () => void;

  // 主题列表
  availableThemes: ThemeConfig[];
}

/**
 * 主题管理Hook
 * @returns 主题状态和相关操作方法
 */
export function useTheme(): UseThemeReturn {
  const {
    currentTheme,
    isDark,
    availableThemes,
    setTheme,
    toggleDarkMode,
    getCurrentTheme,
    initializeTheme
  } = useThemeStore();

  // 客户端初始化主题
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return {
    currentTheme,
    currentThemeConfig: getCurrentTheme(),
    isDark,
    setTheme,
    toggleDarkMode,
    availableThemes
  };
}

/**
 * 主题初始化Hook - 用于应用的根组件
 */
export function useThemeInitializer() {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
}