/**
 * 主题状态管理 - Zustand Store
 * 负责主题切换、CSS变量应用、本地存储持久化
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { themes, defaultTheme } from '@/styles/themes';
import { ThemeId, ThemeState, ThemeConfig } from '@/types/theme';

interface ThemeStore extends ThemeState {
  // 主题切换方法
  setTheme: (themeId: ThemeId) => void;
  toggleDarkMode: () => void;

  // 获取当前主题配置
  getCurrentTheme: () => ThemeConfig;

  // CSS变量应用
  applyThemeCSS: (theme: ThemeConfig) => void;

  // 初始化主题
  initializeTheme: () => void;
}

// 主题存储key
const THEME_STORAGE_KEY = 'ai-workbench-theme';

/**
 * 将主题配置应用到CSS变量
 */
function applyThemeToCSS(theme: ThemeConfig) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // 应用颜色变量
  const colors = theme.colors;
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--popover', colors.popover);
  root.style.setProperty('--popover-foreground', colors.popoverForeground);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);

  // 应用额外颜色变量
  if (colors.success) root.style.setProperty('--success', colors.success);
  if (colors.warning) root.style.setProperty('--warning', colors.warning);
  if (colors.info) root.style.setProperty('--info', colors.info);

  // 应用间距变量
  const spacing = theme.spacing;
  root.style.setProperty('--radius', spacing.radius);
  root.style.setProperty('--radius-sm', spacing.radiusSm);
  root.style.setProperty('--radius-md', spacing.radiusMd);
  root.style.setProperty('--radius-lg', spacing.radiusLg);

  // 应用字体变量
  const typography = theme.typography;
  root.style.setProperty('--font-sans', typography.fontSans);
  root.style.setProperty('--font-mono', typography.fontMono);

  // 应用阴影变量
  const shadows = theme.shadows;
  root.style.setProperty('--shadow-sm', shadows.shadowSm);
  root.style.setProperty('--shadow-md', shadows.shadowMd);
  root.style.setProperty('--shadow-lg', shadows.shadowLg);
  root.style.setProperty('--shadow-xl', shadows.shadowXl);

  // 设置主题类名
  root.classList.remove('theme-apple-minimal', 'theme-cyber-dark', 'theme-bento-grid');
  root.classList.add(`theme-${theme.id}`);
}

/**
 * 主题状态管理Store
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentTheme: defaultTheme.id as ThemeId,
      availableThemes: themes,
      isDark: false,

      // 设置主题
      setTheme: (themeId: ThemeId) => {
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        // 应用主题CSS变量
        applyThemeToCSS(theme);

        // 更新状态
        set({
          currentTheme: themeId,
          isDark: themeId === 'cyber-dark' // 只有cyber-dark是暗色主题
        });
      },

      // 切换暗色模式（针对当前主题）
      toggleDarkMode: () => {
        const { currentTheme, setTheme } = get();

        // 如果当前是cyber-dark，切换到apple-minimal
        // 如果当前是其他主题，切换到cyber-dark
        const newTheme = currentTheme === 'cyber-dark' ? 'apple-minimal' : 'cyber-dark';
        setTheme(newTheme);
      },

      // 获取当前主题配置
      getCurrentTheme: () => {
        const { currentTheme } = get();
        return themes.find(t => t.id === currentTheme) || defaultTheme;
      },

      // 应用主题CSS（外部调用）
      applyThemeCSS: (theme: ThemeConfig) => {
        applyThemeToCSS(theme);
      },

      // 初始化主题（客户端渲染时调用）
      initializeTheme: () => {
        const { currentTheme, setTheme } = get();

        // 延迟执行，确保DOM已准备好
        setTimeout(() => {
          setTheme(currentTheme);
        }, 0);
      }
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        isDark: state.isDark
      })
    }
  )
);