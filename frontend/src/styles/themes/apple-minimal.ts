/**
 * 苹果简约风主题 (Apple Minimalism)
 * 设计特点：大面积使用白色和浅灰色，强调留白，圆角矩形设计
 */

import { ThemeConfig } from '@/types/theme';

export const appleMinimalTheme: ThemeConfig = {
  id: 'apple-minimal',
  name: '苹果简约',
  description: '简洁优雅的苹果风格设计，适合专注工作',
  colors: {
    // 主色调 - 苹果经典配色
    background: '#FFFFFF',
    foreground: '#1D1D1F',

    // 卡片色 - 纯白色背景
    card: '#FFFFFF',
    cardForeground: '#1D1D1F',

    // 弹窗色 - 轻微灰色
    popover: '#FFFFFF',
    popoverForeground: '#1D1D1F',

    // 主色调 - 苹果蓝
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',

    // 次要色 - 浅灰色
    secondary: '#F5F5F7',
    secondaryForeground: '#1D1D1F',

    // 强调色 - 浅蓝色
    accent: '#E6F3FF',
    accentForeground: '#007AFF',

    // 静音色 - 浅灰色
    muted: '#F5F5F7',
    mutedForeground: '#86868B',

    // 破坏性操作 - 红色
    destructive: '#FF3B30',
    destructiveForeground: '#FFFFFF',

    // 边框和输入 - 浅灰色
    border: '#E5E5EA',
    input: '#F2F2F7',
    ring: '#007AFF',

    // 额外颜色
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF'
  },
  spacing: {
    radius: '0.75rem',     // 12px
    radiusSm: '0.5rem',    // 8px
    radiusMd: '0.75rem',   // 12px
    radiusLg: '1rem'       // 16px
  },
  typography: {
    fontSans: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    fontSizeBase: '1rem',    // 16px
    fontSizeSm: '0.875rem',  // 14px
    fontSizeLg: '1.125rem',  // 18px
    fontSizeXl: '1.25rem',   // 20px
    lineHeight: '1.5'
  },
  shadows: {
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};