/**
 * AI工作台主页面
 * 集成主题系统，支持多种主题风格
 */

'use client';

import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';

interface FeatureCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ href, icon, title, description }: FeatureCardProps) {
  return (
    <Link href={href} className="group">
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 hover:scale-105 hover:border-primary/20">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const { currentThemeConfig } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* 主体内容 */}
      <div className="container mx-auto px-4 py-12">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              AI工作台
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            智能化的工作效率提升工具，集成AI记事本、对话、番茄钟和项目管理功能
          </p>
          <p className="text-sm text-muted-foreground/80 mt-4">
            当前主题：<span className="text-primary font-medium">{currentThemeConfig.name}</span>
          </p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          <FeatureCard
            href="/ai-notepad"
            icon="📝"
            title="AI记事本"
            description="智能整理笔记，自动提取待办事项，让思维更有条理"
          />

          <FeatureCard
            href="/ai-chat"
            icon="💬"
            title="AI对话"
            description="与AI助手进行智能对话，支持多模型，提升工作效率"
          />

          <FeatureCard
            href="/pomodoro"
            icon="🍅"
            title="番茄钟"
            description="专注工作25分钟，科学时间管理，提升工作专注度"
          />

          <FeatureCard
            href="/boards"
            icon="📋"
            title="项目管理"
            description="Trello风格看板，高效项目协作，团队协作更顺畅"
          />
        </div>

        {/* 底部说明 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <p className="text-muted-foreground text-sm">
              选择一个功能开始体验AI工作台
            </p>
          </div>
        </div>

        {/* 主题预览区域 */}
        <div className="mt-20 pt-16 border-t border-border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2">主题预览</h2>
            <p className="text-muted-foreground">体验不同的视觉风格，找到最适合你的工作环境</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* 主题色彩预览卡片 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">当前主题色彩</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <div className="w-full h-8 bg-primary rounded border border-border"></div>
                  <p className="text-xs text-muted-foreground">主色</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-8 bg-secondary rounded border border-border"></div>
                  <p className="text-xs text-muted-foreground">次色</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-8 bg-accent rounded border border-border"></div>
                  <p className="text-xs text-muted-foreground">强调</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-8 bg-muted rounded border border-border"></div>
                  <p className="text-xs text-muted-foreground">静音</p>
                </div>
              </div>
            </div>

            {/* 组件预览 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">界面组件</h3>
              <div className="space-y-2">
                <button className="w-full bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm hover:opacity-90 transition-opacity">
                  主要按钮
                </button>
                <button className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm hover:opacity-90 transition-opacity">
                  次要按钮
                </button>
                <div className="bg-muted p-2 rounded text-muted-foreground text-sm">
                  信息提示
                </div>
              </div>
            </div>

            {/* 主题信息 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">主题信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">名称：</span>
                  <span className="text-foreground font-medium">{currentThemeConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">类型：</span>
                  <span className="text-foreground">{currentThemeConfig.id.includes('dark') ? '暗色' : '亮色'}</span>
                </div>
                <div className="text-muted-foreground text-xs mt-2 leading-relaxed">
                  {currentThemeConfig.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}