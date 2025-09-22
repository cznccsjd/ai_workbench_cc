/**
 * 主题切换组件测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useTheme } from '@/hooks/useTheme';

// Mock useTheme hook
jest.mock('@/hooks/useTheme');

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('ThemeSwitcher', () => {
  const mockSetTheme = jest.fn();
  const mockToggleDarkMode = jest.fn();

  const mockThemes = [
    {
      id: 'apple-minimal',
      name: '苹果简约',
      description: '简洁优雅的苹果风格设计',
      colors: {
        background: '#FFFFFF',
        foreground: '#1D1D1F',
        primary: '#007AFF'
      },
      spacing: { radius: '0.75rem', radiusSm: '0.5rem', radiusMd: '0.75rem', radiusLg: '1rem' },
      typography: {
        fontSans: 'SF Pro Display',
        fontMono: 'SF Mono',
        fontSizeBase: '1rem',
        fontSizeSm: '0.875rem',
        fontSizeLg: '1.125rem',
        fontSizeXl: '1.25rem',
        lineHeight: '1.5'
      },
      shadows: {
        shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }
    },
    {
      id: 'cyber-dark',
      name: '科技暗黑',
      description: '赛博朋克风格的深色主题',
      colors: {
        background: '#121212',
        foreground: '#E0E0E0',
        primary: '#00D4FF'
      },
      spacing: { radius: '0.5rem', radiusSm: '0.25rem', radiusMd: '0.5rem', radiusLg: '0.75rem' },
      typography: {
        fontSans: 'JetBrains Mono',
        fontMono: 'JetBrains Mono',
        fontSizeBase: '1rem',
        fontSizeSm: '0.875rem',
        fontSizeLg: '1.125rem',
        fontSizeXl: '1.25rem',
        lineHeight: '1.6'
      },
      shadows: {
        shadowSm: '0 1px 2px 0 rgba(0, 212, 255, 0.1)',
        shadowMd: '0 4px 6px -1px rgba(0, 212, 255, 0.15), 0 2px 4px -1px rgba(0, 212, 255, 0.1)',
        shadowLg: '0 10px 15px -3px rgba(0, 212, 255, 0.15), 0 4px 6px -2px rgba(0, 212, 255, 0.1)',
        shadowXl: '0 0 20px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)'
      }
    }
  ];

  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      currentTheme: 'apple-minimal',
      currentThemeConfig: mockThemes[0],
      isDark: false,
      setTheme: mockSetTheme,
      toggleDarkMode: mockToggleDarkMode,
      availableThemes: mockThemes
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染主题切换器', () => {
    render(<ThemeSwitcher />);

    // 检查主题名称是否显示
    expect(screen.getByText('苹果简约')).toBeInTheDocument();

    // 检查图标是否存在
    expect(screen.getByTitle(/切换到暗色模式/i)).toBeInTheDocument();
  });

  it('应该切换暗色模式', async () => {
    render(<ThemeSwitcher />);

    const darkModeButton = screen.getByTitle(/切换到暗色模式/i);
    fireEvent.click(darkModeButton);

    await waitFor(() => {
      expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    });
  });

  it('应该打开主题选择下拉菜单', async () => {
    render(<ThemeSwitcher />);

    // 获取主题选择按钮（使用getAllByText处理多个匹配）
    const themeButtons = screen.getAllByText('苹果简约');
    const themeButton = themeButtons[0]; // 选择第一个匹配的元素
    fireEvent.click(themeButton);

    await waitFor(() => {
      // 检查下拉菜单是否打开
      expect(screen.getByText('选择主题')).toBeInTheDocument();

      // 检查所有主题选项
      expect(screen.getAllByText('苹果简约').length).toBeGreaterThan(0);
      expect(screen.getByText('科技暗黑')).toBeInTheDocument();
    });
  });

  it('应该切换主题', async () => {
    render(<ThemeSwitcher />);

    // 打开下拉菜单
    const themeButtons = screen.getAllByText('苹果简约');
    const themeButton = themeButtons[0];
    fireEvent.click(themeButton);

    // 等待下拉菜单打开
    await waitFor(() => {
      expect(screen.getByText('选择主题')).toBeInTheDocument();
    });

    // 选择新主题
    const cyberDarkOption = screen.getByText('科技暗黑');
    fireEvent.click(cyberDarkOption);

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('cyber-dark');
    });
  });
});