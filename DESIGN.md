# DESIGN.md: AI工作台设计规范文档 (v1.0)

## 1. 设计哲学

我们的设计哲学是 **“简约、智能、无干扰”**。界面应服务于内容，AI功能应在用户需要时自然出现，而不是喧宾夺主。设计的目标是创造一个让用户沉浸于工作和思考的环境。

## 2. 全局主题系统

主题系统是本项目设计的核心。所有组件和页面都将基于一套设计变量（Design Tokens）构建，以实现一键切换全局风格。

### 2.1 默认主题: 苹果简约风 (Apple Minimalism)
-   **色彩**: 大面积使用白色（`#FFFFFF`）和浅灰色（`#F5F5F7`）作为背景。主色调为中性灰（`#1D1D1F`）用于文本，辅以蓝色（`#007AFF`）作为交互和高亮色。
-   **字体**:
    -   英文/数字: San Francisco (SF Pro)
    -   中文: 苹方 (PingFang SC)
-   **布局**: 强调留白，元素间距清晰，视觉层级分明。
-   **元素**: 使用圆角矩形（8px-16px Radius），阴影效果细腻、柔和，营造轻微的深度感。图标采用线性和填充结合的简约风格。

### 2.2 备选主题 (2025年流行趋势调研)

#### 主题A: 科技暗黑 (Cyber Dark)
-   **灵感**: 赛博朋克、开发者工具。
-   **色彩**: 以深邃的近黑色（`#121212`）为背景，搭配高饱和度的霓虹色（如青色、品红色）作为点缀和交互色。文本使用不同亮度的灰色来区分层级。
-   **元素**: 卡片和容器带有微弱的辉光效果。可能会使用等宽字体来营造代码感。
-   **适用场景**: 适合在低光环境下工作，或偏爱科技感的用户。

#### 主题B: Bento网格风 (Bento Grid)
-   **灵感**: Apple WWDC页面、现代仪表盘。
-   **布局**: 核心页面（如仪表盘）将采用大小不一的卡片网格布局（Bento Grid），将不同功能模块化、可视化地呈现。
-   **色彩**: 采用柔和的莫兰迪色系或明亮的糖果色系，每个“Bento Box”可以有自己独立的背景色，但整体保持协调。
-   **元素**: 卡片之间有明显的间距，圆角更大（16px-24px），内容排版更加自由和富有趣味性。
-   **适用场景**: 适合需要同时关注多个信息模块的用户，视觉冲击力强。

## 3. 关键页面布局草案

-   **AI记事本**:
    -   **三栏布局**:
        -   **左栏 (20%)**: 笔记文件夹和列表。
        -   **中栏 (55%)**: Markdown编辑器主区域。
        -   **右栏 (25%)**: AI操作面板（智能整理、摘要、翻译等）和笔记元信息。
-   **项目管理 (Trello风格)**:
    -   **横向滚动布局**:
        -   **背景**: 可以设置图片或纯色背景。
        -   **列表 (List)**: 垂直排列的卡片容器，列表宽度固定，内容超出时可垂直滚动。
        -   **看板 (Board)**: 列表容器横向排列，超出屏幕宽度时可水平滚动。
-   **番茄钟**:
    -   **单页专注布局**: 页面中央是巨大的倒计时数字，背景色会随着工作/休息状态变化。设置和其他选项默认隐藏，以减少干扰。

## 4. 核心组件库 (已实现)

我们已构建了一套完整的UI组件库，确保所有页面风格统一，并能响应主题切换。所有组件基于Tailwind CSS设计变量构建，支持TypeScript和完整的可访问性。

### 4.1 基础组件

#### Button (按钮组件) ✅
**文件位置**: `frontend/src/components/ui/button.tsx`

**变体类型**:
- `default`: 主要操作按钮，蓝色背景
- `destructive`: 危险操作，红色背景
- `outline`: 边框按钮，透明背景
- `secondary`: 次要操作，灰色背景
- `ghost`: 幽灵按钮，仅在hover时显示背景
- `link`: 链接样式按钮

**尺寸规格**:
- `default`: 40px高度，标准内边距
- `sm`: 36px高度，紧凑型
- `lg`: 44px高度，大型按钮
- `icon`: 40x40px正方形，图标按钮

**使用示例**:
```typescript
<Button variant="default" size="lg">保存</Button>
<Button variant="outline" size="sm">取消</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
```

#### Card (卡片组件) ✅
**文件位置**: `frontend/src/components/ui/card.tsx`

**组件结构**:
- `Card`: 主容器，圆角边框+阴影
- `CardHeader`: 头部区域，包含标题和描述
- `CardTitle`: 卡片标题，使用h3标签
- `CardDescription`: 卡片描述，灰色文本
- `CardContent`: 主要内容区域
- `CardFooter`: 底部操作区域

**设计特点**:
- 圆角边框 (`rounded-lg`)
- 轻微阴影效果 (`shadow-sm`)
- 响应主题变量 (`bg-card`, `text-card-foreground`)

#### Input (输入框组件) ✅
**文件位置**: `frontend/src/components/ui/input.tsx`

**特性**:
- 标准化边框和圆角
- Focus状态视觉反馈
- 禁用状态样式
- 完整的键盘导航支持

#### Switch (开关组件) ✅
**文件位置**: `frontend/src/components/ui/switch.tsx`

**用途**: 主题切换、设置开关
**特性**: 平滑动画过渡、触摸友好

#### Alert (提示组件) ✅
**文件位置**: `frontend/src/components/ui/alert.tsx`

**用途**: 系统通知、错误提示、成功消息
**变体**: 信息、警告、错误、成功

### 4.2 复合组件

#### LoadingSpinner (加载指示器) ✅
**文件位置**: `frontend/src/components/ui/LoadingSpinner.tsx`

**用途**: AI对话加载、数据获取等待状态
**特性**: 旋转动画、主题色适配

#### ErrorMessage (错误信息) ✅
**文件位置**: `frontend/src/components/ui/ErrorMessage.tsx`

**用途**: 表单验证、API错误显示
**特性**: 图标+文本、错误色主题

### 4.3 业务组件

#### AI记事本组件族
**文件位置**: `frontend/src/components/ai-notepad/`

- `NoteEditor`: Markdown编辑器组件
- `NoteList`: 笔记列表展示
- `TodoPanel`: 待办任务面板
- `AIOperationPanel`: AI操作控制面板

#### 番茄钟组件族
**文件位置**: `frontend/src/components/pomodoro/`

- `PomodoroTimer`: 主计时器组件
- `PomodoroControls`: 控制按钮组
- `PomodoroStats`: 统计数据展示
- `SessionSettings`: 会话设置面板

#### 看板管理组件族
**文件位置**: `frontend/src/components/kanban/`

- `KanbanBoard`: 看板主容器
- `ListColumn`: 列表列组件
- `CardItem`: 卡片项组件
- `DragDropProvider`: 拖拽上下文提供者

#### 主题切换组件族
**文件位置**: `frontend/src/components/theme/`

- `ThemeToggle`: 主题切换按钮
- `ThemeProvider`: 主题上下文提供者
- `ThemeSettings`: 主题设置面板

### 4.4 设计原则

#### 一致性原则
- **颜色系统**: 所有组件使用CSS变量，支持主题切换
- **字体规范**: 中文使用苹方，英文使用San Francisco
- **间距系统**: 基于4px网格的统一间距体系
- **圆角规范**: 统一使用8px、12px、16px圆角

#### 可访问性原则
- **键盘导航**: 所有交互组件支持Tab键导航
- **屏幕阅读器**: 完整的ARIA标签支持
- **色彩对比**: 符合WCAG 2.1 AA级标准
- **焦点管理**: 清晰的焦点指示器

#### 性能原则
- **React.forwardRef**: 所有组件支持ref传递
- **TypeScript**: 完整的类型定义和智能提示
- **Tree Shaking**: 支持按需导入，减少打包体积
- **懒加载**: 业务组件支持动态导入

### 4.5 主题系统集成

#### 设计变量 (Design Tokens)
所有组件基于以下CSS变量构建，支持主题动态切换：

```css
:root {
  /* 基础色彩 */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;

  /* 交互状态 */
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* 边框和输入 */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
}
```

#### 主题切换实现
- **即时生效**: CSS变量更新，所有组件立即响应
- **持久化**: 用户偏好存储在localStorage
- **平滑过渡**: transition动画确保切换流畅

### 4.6 组件开发规范

#### 组件结构标准
```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'alternative'
  size?: 'sm' | 'default' | 'lg'
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    )
  }
)
Component.displayName = 'Component'

export { Component }
```

#### 文档规范
- 每个组件都有完整的TypeScript接口定义
- 使用JSDoc注释描述组件用途和属性
- 提供使用示例和最佳实践

#### 测试规范
- 单元测试覆盖组件渲染和属性
- 可访问性测试确保无障碍使用
- 视觉回归测试确保样式一致性