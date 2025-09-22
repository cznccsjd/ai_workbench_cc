/**
 * 主题切换组件
 * 提供主题选择和暗色模式切换功能
 */

'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ThemeId } from '@/types/theme';
import { Palette, Moon, Sun, ChevronDown, Check } from 'lucide-react';

export function ThemeSwitcher() {
  const { currentTheme, isDark, setTheme, toggleDarkMode, availableThemes, currentThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 防止服务端渲染不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <Palette className="w-4 h-4 text-muted-foreground" />
        <div className="w-20 h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const handleThemeSelect = (themeId: ThemeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  return (
    <div className="relative">
      {/* 主切换按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDarkModeToggle}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          title={isDark ? "切换到亮色模式" : "切换到暗色模式"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-yellow-500" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" />
          )}
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Palette className="w-4 h-4" />
          <span className="text-sm font-medium">
            {currentThemeConfig.name}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 主题选择下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                选择主题
              </div>

              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id as ThemeId)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                    currentTheme === theme.id ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  {/* 主题预览色块 */}
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: theme.colors.background }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {theme.description}
                    </div>
                  </div>

                  {currentTheme === theme.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* 暗色模式切换 */}
            <div className="border-t border-border p-2">
              <button
                onClick={handleDarkModeToggle}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="text-sm font-medium">暗色模式</span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${
                  isDark ? 'bg-primary' : 'bg-muted'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 主题切换器 - 简化版本（仅图标）
 */
export function ThemeToggle() {
  const { isDark, toggleDarkMode, currentThemeConfig } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-muted/50">
        <Palette className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
      title={`切换到${isDark ? '亮色' : '暗色'}模式 - 当前：${currentThemeConfig.name}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-500" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500" />
      )}
    </button>
  );
}