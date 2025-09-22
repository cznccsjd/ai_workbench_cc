# 主题系统文档

## 概述

AI工作台的主题系统基于CSS变量和Zustand状态管理，支持一键切换全局主题，用户偏好持久化，以及无闪烁切换体验。

## 主题列表

### 1. 苹果简约风 (Apple Minimalism) - 默认主题
- **特点**: 简洁优雅的苹果风格设计
- **适用场景**: 专注工作，日常办公
- **色彩**: 大面积白色背景，苹果蓝主色调
- **字体**: SF Pro Display (英文) / 苹方 (中文)

### 2. 科技暗黑 (Cyber Dark)
- **特点**: 赛博朋克风格的深色主题
- **适用场景**: 夜间编程，低光环境
- **色彩**: 深邃黑色背景，霓虹色点缀
- **字体**: JetBrains Mono 等宽字体
- **特效**: 霓虹发光效果

### 3. Bento网格风 (Bento Grid)
- **特点**: 现代仪表盘风格的模块化布局
- **适用场景**: 多任务管理，数据可视化
- **色彩**: 莫兰迪色系，和谐配色
- **字体**: Inter 字体家族
- **布局**: 支持Bento网格布局

## 核心功能

### 1. 主题切换
- ✅ 一键切换主题
- ✅ 即时生效，无闪烁
- ✅ 支持亮色/暗色模式切换
- ✅ 用户偏好本地存储

### 2. 技术实现
- **CSS变量**: 动态主题变量系统
- **Zustand**: 轻量级状态管理
- **持久化**: localStorage自动保存
- **性能优化**: 防止闪烁和重绘

### 3. 使用方式

#### 基础使用
```tsx
import { useTheme } from '@/hooks/useTheme';
import { ThemeSwitcher } from '@/components/theme';

function MyComponent() {
  const { currentTheme, setTheme, toggleDarkMode } = useTheme();

  return (
    <div>
      <ThemeSwitcher />
      <p>当前主题: {currentTheme}</p>
    </div>
  );
}
```

#### 自定义主题
```tsx
import { ThemeConfig } from '@/types/theme';

const customTheme: ThemeConfig = {
  id: 'my-theme',
  name: '我的主题',
  description: '自定义主题描述',
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    // ... 其他颜色
  },
  spacing: {
    radius: '0.5rem',
    // ... 其他间距
  },
  typography: {
    fontSans: 'Arial, sans-serif',
    // ... 其他字体设置
  },
  shadows: {
    shadowSm: '0 1px 2px rgba(0,0,0,0.1)',
    // ... 其他阴影
  }
};
```

## 文件结构

```
src/
├── styles/
│   └── themes/
│       ├── apple-minimal.ts    # 苹果简约主题
│       ├── cyber-dark.ts       # 科技暗黑主题
│       ├── bento-grid.ts       # Bento网格主题
│       └── index.ts           # 主题导出
├── types/
│   └── theme.ts               # 主题类型定义
├── stores/
│   └── themeStore.ts          # 主题状态管理
├── hooks/
│   └── useTheme.ts            # 主题Hook
├── components/
│   └── theme/
│       ├── ThemeSwitcher.tsx  # 主题切换组件
│       ├── ThemeProvider.tsx  # 主题提供器
│       └── index.ts           # 主题组件导出
└── __tests__/
    ├── components/theme/      # 主题组件测试
    └── stores/themeStore.test.ts # 主题存储测试
```

## API参考

### useTheme Hook
```tsx
const {
  currentTheme,           // 当前主题ID
  currentThemeConfig,     // 当前主题配置
  isDark,                 // 是否为暗色模式
  setTheme,               // 设置主题
  toggleDarkMode,         // 切换暗色模式
  availableThemes         // 可用主题列表
} = useTheme();
```

### ThemeSwitcher Props
```tsx
<ThemeSwitcher
  variant="full"          // full | toggle
  position="header"       // 位置配置
  showPreview={true}      // 是否显示预览
/>
```

## 性能优化

### 1. 防止闪烁
- 使用 `ThemeProvider` 组件在客户端渲染前保持一致状态
- CSS过渡动画确保平滑切换
- 骨架屏避免布局跳动

### 2. 性能考虑
- Zustand状态管理，轻量级高效
- CSS变量直接操作，避免重计算
- 本地存储异步操作，不影响主线程

### 3. 可访问性
- 支持键盘导航
- 提供适当的ARIA标签
- 高对比度模式兼容

## 扩展指南

### 添加新主题

1. 在 `src/styles/themes/` 创建新主题文件
2. 定义主题配置，遵循 `ThemeConfig` 接口
3. 在 `src/styles/themes/index.ts` 中导出
4. 更新主题列表

### 自定义主题变量

可以扩展 `ThemeColors` 接口添加自定义颜色变量：

```tsx
interface ThemeColors {
  // 基础颜色
  background: string;
  foreground: string;
  // ... 其他基础颜色

  // 自定义颜色
  brand?: string;
  surface?: string;
  elevated?: string;
}
```

### 主题特定样式

在 `globals.css` 中添加主题特定样式：

```css
.theme-cyber-dark {
  /* 科技暗黑主题特定样式 */
}

.theme-bento-grid {
  /* Bento网格主题特定样式 */
}
```

## 最佳实践

1. **使用CSS变量**: 始终使用CSS变量而非硬编码颜色
2. **主题一致性**: 确保所有组件都使用主题系统
3. **性能监控**: 监控主题切换性能
4. **用户反馈**: 提供主题切换反馈
5. **测试覆盖**: 为主题功能编写测试用例

## 故障排除

### 主题切换无响应
- 检查是否正确使用 `useTheme` Hook
- 确认主题配置格式正确
- 查看控制台错误信息

### 样式不一致
- 确保所有组件使用CSS变量
- 检查主题特定样式冲突
- 验证Tailwind配置

### 性能问题
- 避免在主题切换时进行大量计算
- 使用React.memo优化组件
- 检查CSS变量应用频率