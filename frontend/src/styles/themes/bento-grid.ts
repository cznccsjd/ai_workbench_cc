/**
 * Bento网格风主题 (Bento Grid)
 * 设计特点：模块化卡片布局，莫兰迪色系，大圆角设计，现代仪表盘风格
 */

import { ThemeConfig } from '@/types/theme';

export const bentoGridTheme: ThemeConfig = {
  id: 'bento-grid',
  name: 'Bento网格',
  description: '现代仪表盘风格的模块化布局，色彩丰富而和谐',
  colors: {
    // 主色调 - 柔和背景
    background: '#FAFAFA',
    foreground: '#2D3748',

    // 卡片色 - 多种柔和色彩
    card: '#FFFFFF',
    cardForeground: '#2D3748',

    // 弹窗色 - 纯白色
    popover: '#FFFFFF',
    popoverForeground: '#2D3748',

    // 主色调 - 莫兰迪蓝
    primary: '#6B7A99',
    primaryForeground: '#FFFFFF',

    // 次要色 - 莫兰迪绿
    secondary: '#A8B5C8',
    secondaryForeground: '#FFFFFF',

    // 强调色 - 莫兰迪橙
    accent: '#D4A574',
    accentForeground: '#FFFFFF',

    // 静音色 - 浅灰色
    muted: '#F7F6F3',
    mutedForeground: '#718096',

    // 破坏性操作 - 莫兰迪红
    destructive: '#C05656',
    destructiveForeground: '#FFFFFF',

    // 边框和输入 - 浅灰色
    border: '#E2E8F0',
    input: '#F7FAFC',
    ring: '#6B7A99',

    // 额外颜色 - Bento专用
    success: '#68D391',
    warning: '#F6AD55',
    info: '#63B3ED'
  },
  spacing: {
    radius: '1rem',       // 16px - 大圆角
    radiusSm: '0.75rem',  // 12px
    radiusMd: '1rem',     // 16px
    radiusLg: '1.5rem'    // 24px
  },
  typography: {
    fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    fontSizeBase: '1rem',    // 16px
    fontSizeSm: '0.875rem',  // 14px
    fontSizeLg: '1.125rem',  // 18px
    fontSizeXl: '1.25rem',   // 20px
    lineHeight: '1.6'
  },
  shadows: {
    shadowSm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};