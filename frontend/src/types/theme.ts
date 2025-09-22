/**
 * 主题系统类型定义
 */

export interface ThemeColors {
  // 背景色
  background: string;
  foreground: string;

  // 卡片色
  card: string;
  cardForeground: string;

  // 弹窗色
  popover: string;
  popoverForeground: string;

  // 主色调
  primary: string;
  primaryForeground: string;

  // 次要色
  secondary: string;
  secondaryForeground: string;

  // 强调色
  accent: string;
  accentForeground: string;

  // 静音色
  muted: string;
  mutedForeground: string;

  // 破坏性操作色
  destructive: string;
  destructiveForeground: string;

  // 边框和输入
  border: string;
  input: string;
  ring: string;

  // 额外颜色
  success?: string;
  warning?: string;
  info?: string;
}

export interface ThemeSpacing {
  radius: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
}

export interface ThemeTypography {
  fontSans: string;
  fontMono: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontSizeXl: string;
  lineHeight: string;
}

export interface ThemeShadows {
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadows: ThemeShadows;
}

export type ThemeId = 'apple-minimal' | 'cyber-dark' | 'bento-grid';

export interface ThemeState {
  currentTheme: ThemeId;
  availableThemes: ThemeConfig[];
  isDark: boolean;
}