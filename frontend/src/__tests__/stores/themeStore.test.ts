/**
 * 主题状态管理测试
 */

import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from '@/stores/themeStore';
import { appleMinimalTheme, cyberDarkTheme, bentoGridTheme } from '@/styles/themes';

// Mock document.documentElement
const mockSetProperty = jest.fn();
const mockClassList = {
  add: jest.fn(),
  remove: jest.fn(),
};

Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: mockSetProperty,
    },
    classList: mockClassList,
  },
  writable: true,
});

describe('ThemeStore', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();

    // 重置Zustand store
    useThemeStore.setState({
      currentTheme: 'apple-minimal',
      isDark: false,
    });
  });

  it('应该正确初始化主题', () => {
    const { result } = renderHook(() => useThemeStore());

    expect(result.current.currentTheme).toBe('apple-minimal');
    expect(result.current.isDark).toBe(false);
    expect(result.current.availableThemes).toHaveLength(3);
  });

  it('应该正确设置主题', () => {
    const { result } = renderHook(() => useThemeStore());

    // 设置新主题
    act(() => {
      result.current.setTheme('cyber-dark');
    });

    // 检查状态
    expect(result.current.currentTheme).toBe('cyber-dark');
    expect(result.current.isDark).toBe(true);
  });

  it('应该正确切换暗色模式', () => {
    const { result } = renderHook(() => useThemeStore());

    // 初始状态：apple-minimal（亮色）
    expect(result.current.currentTheme).toBe('apple-minimal');
    expect(result.current.isDark).toBe(false);

    // 切换到暗色模式
    act(() => {
      result.current.toggleDarkMode();
    });

    // 应该切换到cyber-dark
    expect(result.current.currentTheme).toBe('cyber-dark');
    expect(result.current.isDark).toBe(true);

    // 再次切换
    act(() => {
      result.current.toggleDarkMode();
    });

    // 应该切换回apple-minimal
    expect(result.current.currentTheme).toBe('apple-minimal');
    expect(result.current.isDark).toBe(false);
  });

  it('应该正确获取当前主题配置', () => {
    const { result } = renderHook(() => useThemeStore());

    const currentTheme = result.current.getCurrentTheme();

    expect(currentTheme).toEqual(appleMinimalTheme);
  });

  it('应该处理无效的主题ID', () => {
    const { result } = renderHook(() => useThemeStore());

    const initialTheme = result.current.currentTheme;

    // 尝试设置无效的主题ID
    act(() => {
      result.current.setTheme('invalid-theme' as any);
    });

    // 主题应该保持不变
    expect(result.current.currentTheme).toBe(initialTheme);
  });
});