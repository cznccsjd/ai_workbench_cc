/**
 * 主题系统演示页面
 * 用于展示和测试主题切换功能
 */

'use client';

import { useTheme } from '@/hooks/useTheme';
import { ThemeSwitcher } from '@/components/theme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ThemeDemoPage() {
  const { currentTheme, currentThemeConfig, isDark, setTheme, availableThemes } = useTheme();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            主题系统演示
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI工作台的主题系统支持一键切换全局风格，提供苹果简约风、科技暗黑和Bento网格三种精心设计的主题
          </p>
        </div>

        {/* 主题切换器 */}
        <div className="flex justify-center mb-12">
          <ThemeSwitcher />
        </div>

        {/* 当前主题信息 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              当前主题: {currentThemeConfig.name}
            </CardTitle>
            <CardDescription>
              {currentThemeConfig.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">主题ID</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {currentTheme}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">模式</h4>
                <div className="flex items-center gap-2">
                  {isDark ? (
                    <>
                      <Moon className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">暗色模式</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">亮色模式</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">可用主题</h4>
                <p className="text-sm text-muted-foreground">
                  {availableThemes.length} 个主题
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 颜色展示 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>主题色彩</CardTitle>
            <CardDescription>
              当前主题的主要颜色配置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg border border-border"
                  style={{ backgroundColor: currentThemeConfig.colors.background }}
                />
                <div className="text-sm">
                  <div className="font-medium">背景色</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {currentThemeConfig.colors.background}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg border border-border"
                  style={{ backgroundColor: currentThemeConfig.colors.foreground }}
                />
                <div className="text-sm">
                  <div className="font-medium">前景色</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {currentThemeConfig.colors.foreground}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg border border-border"
                  style={{ backgroundColor: currentThemeConfig.colors.primary }}
                />
                <div className="text-sm">
                  <div className="font-medium">主色调</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {currentThemeConfig.colors.primary}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg border border-border"
                  style={{ backgroundColor: currentThemeConfig.colors.accent }}
                />
                <div className="text-sm">
                  <div className="font-medium">强调色</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {currentThemeConfig.colors.accent}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 组件展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                成功状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  这是一个成功状态的示例文本
                </p>
                <Button variant="default" size="sm">
                  主要按钮
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                警告状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  这是一个警告状态的示例文本
                </p>
                <Button variant="secondary" size="sm">
                  次要按钮
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-info" />
                信息状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  这是一个信息状态的示例文本
                </p>
                <Button variant="outline" size="sm">
                  边框按钮
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主题预览 */}
        <Card>
          <CardHeader>
            <CardTitle>可用主题预览</CardTitle>
            <CardDescription>
              点击下方的主题卡片可以快速切换主题
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id as any)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    currentTheme === theme.id
                      ? 'border-primary bg-accent'
                      : 'border-border bg-card hover:border-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
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
                    {currentTheme === theme.id && (
                      <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                  <h3 className="font-semibold text-left">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground text-left">
                    {theme.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}