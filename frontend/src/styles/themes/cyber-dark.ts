/**
 * 科技暗黑主题 (Cyber Dark)
 * 设计特点：深邃黑色背景，霓虹色点缀，辉光效果，适合夜间工作
 */

import { ThemeConfig } from '@/types/theme';

export const cyberDarkTheme: ThemeConfig = {
  id: 'cyber-dark',
  name: '科技暗黑',
  description: '赛博朋克风格的深色主题，适合夜间编程和工作',
  colors: {
    // 主色调 - 深邃黑色背景
    background: '#121212',
    foreground: '#E0E0E0',

    // 卡片色 - 近黑色
    card: '#1E1E1E',
    cardForeground: '#E0E0E0',

    // 弹窗色 - 深灰色
    popover: '#242424',
    popoverForeground: '#E0E0E0',

    // 主色调 - 霓虹青色
    primary: '#00D4FF',
    primaryForeground: '#000000',

    // 次要色 - 深灰色
    secondary: '#242424',
    secondaryForeground: '#E0E0E0',

    // 强调色 - 霓虹品红
    accent: '#FF0080',
    accentForeground: '#FFFFFF',

    // 静音色 - 深灰色
    muted: '#2A2A2A',
    mutedForeground: '#888888',

    // 破坏性操作 - 霓虹红
    destructive: '#FF3333',
    destructiveForeground: '#FFFFFF',

    // 边框和输入 - 深灰色
    border: '#333333',
    input: '#2A2A2A',
    ring: '#00D4FF',

    // 额外颜色
    success: '#00FF88',
    warning: '#FFB800',
    info: '#00D4FF'
  },
  spacing: {
    radius: '0.5rem',     // 8px - 更锐利的感觉
    radiusSm: '0.25rem',  // 4px
    radiusMd: '0.5rem',   // 8px
    radiusLg: '0.75rem'   // 12px
  },
  typography: {
    fontSans: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    fontMono: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    fontSizeBase: '1rem',    // 16px
    fontSizeSm: '0.875rem',  // 14px
    fontSizeLg: '1.125rem',  // 18px
    fontSizeXl: '1.25rem',   // 20px
    lineHeight: '1.6'
  },
  shadows: {
    shadowSm: '0 1px 2px 0 rgba(0, 212, 255, 0.1)',
    shadowMd: '0 4px 6px -1px rgba(0, 212, 255, 0.15), 0 2px 4px -1px rgba(0, 212, 255, 0.1)',
    shadowLg: '0 10px 15px -3px rgba(0, 212, 255, 0.15), 0 4px 6px -2px rgba(0, 212, 255, 0.1)',
    shadowXl: '0 0 20px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)'
  }
};