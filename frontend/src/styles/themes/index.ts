/**
 * 主题配置导出
 */

import { appleMinimalTheme } from './apple-minimal';
import { cyberDarkTheme } from './cyber-dark';
import { bentoGridTheme } from './bento-grid';
import { ThemeConfig } from '@/types/theme';

export const themes: ThemeConfig[] = [
  appleMinimalTheme,
  cyberDarkTheme,
  bentoGridTheme
];

export const defaultTheme = appleMinimalTheme;

export * from './apple-minimal';
export * from './cyber-dark';
export * from './bento-grid';