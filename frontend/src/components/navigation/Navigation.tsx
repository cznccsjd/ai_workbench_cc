/**
 * 主导航组件
 * 提供应用的主要导航功能
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: '看板', href: '/boards', icon: ClipboardDocumentListIcon },
  { name: 'AI助手', href: '/ai-chat', icon: ChatBubbleLeftRightIcon },
  { name: '番茄钟', href: '/pomodoro', icon: ClockIcon },
  { name: 'AI笔记本', href: '/ai-notepad', icon: ClipboardDocumentListIcon },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-foreground">AI工作台</h1>
              </div>
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* 设置按钮 */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/settings"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 z-50 w-64 h-full bg-card shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">菜单</h2>
              <button
                type="button"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground border-r-2 border-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
              <hr className="my-4 border-border" />
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-3" />
                设置
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}