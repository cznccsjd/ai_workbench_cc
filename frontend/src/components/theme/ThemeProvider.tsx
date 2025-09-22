/**
 * 主题提供器组件
 * 负责在应用启动时初始化主题，防止闪烁
 */

'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

/**
 * 主题提供器 - 防止主题切换闪烁
 * 在客户端渲染前保持与本地存储一致的主题状态
 */
export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    // 组件挂载后初始化主题
    initializeTheme();
    setMounted(true);
  }, [initializeTheme]);

  // 在客户端渲染完成前，应用默认样式防止闪烁
  if (!mounted) {
    return (
      <>
        {/* 防止闪烁的样式 */}
        <style jsx global>{`
          /* 隐藏内容直到主题加载完成 */
          body {
            opacity: 0;
            transition: opacity 0.1s ease-in-out;
          }

          /* 主题加载完成后的样式 */
          .theme-loaded body {
            opacity: 1;
          }
        `}</style>
        {children}
      </>
    );
  }

  return (
    <div className="theme-loaded">
      {children}
    </div>
  );
}