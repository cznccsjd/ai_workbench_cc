# AI记事本功能设置指南

## 功能概述

AI记事本是一个智能的笔记管理工具，具有以下核心功能：

- **智能写作**: 支持Markdown格式的实时编辑和预览
- **AI整理**: 一键优化笔记结构和内容
- **Todo提取**: 智能识别笔记中的任务并生成Todo清单
- **三栏布局**: 笔记列表 | 编辑器 | Todo面板的高效工作流
- **搜索筛选**: 支持全文搜索、标签筛选和排序
- **数据同步**: 实时自动保存和状态管理

## 前端组件结构

```
frontend/src/components/ai-notepad/
├── AiNotepad.tsx          # 主组件，协调整个应用
├── MarkdownEditor.tsx     # Markdown编辑器组件
├── NoteList.tsx          # 笔记列表组件
├── TodoPanel.tsx         # Todo面板组件
└── ThreeColumnLayout.tsx # 三栏布局组件
```

## 状态管理

使用Zustand进行状态管理，主要包含：

- 笔记的CRUD操作
- Todo事项管理
- 搜索和过滤功能
- AI处理状态管理

## API集成

前端API调用位于 `frontend/src/lib/api/notes.ts`，提供：

- 笔记的增删改查
- AI智能整理
- Todo提取和管理
- 统计信息获取

## 后端实现

### 数据库模型

```python
# backend/models/note.py
- Note: 笔记主表
- Todo: Todo事项表
- Tag: 标签表
- NoteVersion: 版本历史表
```

### API路由

```python
# backend/routers/notes.py
- GET /api/notes/          # 获取笔记列表
- POST /api/notes/         # 创建新笔记
- GET /api/notes/{id}      # 获取单个笔记
- PUT /api/notes/{id}      # 更新笔记
- DELETE /api/notes/{id}   # 删除笔记
- POST /api/notes/{id}/organize     # AI整理笔记
- POST /api/notes/{id}/extract-todos # AI提取Todo
```

### AI服务

```python
# backend/services/ai_service.py
- organize_note_content(): 智能整理笔记内容
- extract_todos_from_note(): 提取Todo事项
- generate_summary(): 生成内容摘要
```

## 快速开始

### 1. 安装依赖

**后端依赖:**
```bash
pip install -r requirements.txt
```

**前端依赖:**
```bash
cd frontend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：
```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/ai_workbench

# Redis配置
REDIS_URL=redis://localhost:6379

# AI服务配置（可选）
KIMI_API_KEY=your_kimi_api_key
OPENAI_API_KEY=your_openai_api_key

# JWT配置
SECRET_KEY=your_secret_key
```

### 3. 初始化数据库

```bash
cd backend
python -c "from database import init_db; init_db()"
```

### 4. 启动服务

**启动后端:**
```bash
cd backend
python main.py
```

**启动前端:**
```bash
cd frontend
npm run dev
```

### 5. 访问应用

打开浏览器访问: http://localhost:3000/ai-notepad

## 使用说明

### 创建笔记

1. 点击左侧面板的"新建笔记"按钮
2. 在中间的编辑器中输入内容
3. 支持Markdown格式，实时自动保存

### AI功能

**智能整理:**
1. 选中要整理的笔记
2. 点击编辑器工具栏的"🤖 整理"按钮
3. 等待AI处理完成，笔记内容将自动优化

**Todo提取:**
1. 选中包含任务的笔记
2. 点击编辑器工具栏的"✅ 提取Todo"按钮
3. 右侧面板将显示提取的Todo事项

### 搜索和筛选

- 在左侧面板顶部的搜索框输入关键词
- 点击"筛选"按钮按标签筛选
- 使用排序选项按时间或标题排序

### Todo管理

- 在右侧面板查看和管理Todo事项
- 点击复选框标记完成状态
- 支持按状态筛选（全部/待完成/已完成）
- 显示完成进度条

## 测试

### 运行后端测试

```bash
cd backend
pytest tests/test_note_api.py -v
```

### 运行前端测试

```bash
cd frontend
npm test
```

## 配置选项

### AI服务配置

支持两种AI服务：
- **Kimi API**: 月之暗面提供的AI服务
- **OpenAI API**: OpenAI的GPT服务

如果未配置API密钥，系统将使用模拟数据进行演示。

### 数据库配置

支持PostgreSQL数据库，需要配置正确的连接字符串。

### 文件上传

支持文件上传功能，需要配置上传目录和文件大小限制。

## 性能优化

- 使用React 18的并发特性
- 实现虚拟滚动处理大量笔记
- 使用防抖优化搜索性能
- 实现分页加载
- 使用Redis缓存热点数据

## 安全考虑

- JWT身份验证
- 输入验证和清理
- SQL注入防护
- XSS攻击防护
- 文件上传安全检查

## 故障排除

### 常见问题

1. **AI功能无法使用**
   - 检查API密钥配置
   - 确认网络连接正常
   - 查看后端日志获取详细信息

2. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接字符串配置
   - 确保数据库已创建

3. **前端构建失败**
   - 检查Node.js版本兼容性
   - 清除node_modules重新安装
   - 检查TypeScript类型错误

### 日志查看

后端日志位于 `./logs/app.log`，包含详细的错误信息和调试日志。

## 扩展开发

### 添加新的AI功能

1. 在 `backend/services/ai_service.py` 中添加新方法
2. 在 `backend/routers/notes.py` 中添加对应路由
3. 更新前端API调用
4. 添加相应的UI组件

### 自定义Markdown扩展

1. 修改 `MarkdownEditor.tsx` 中的渲染逻辑
2. 添加新的工具栏按钮
3. 更新样式和交互

### 集成其他AI服务

1. 在 `ai_service.py` 中添加新的API调用方法
2. 实现相应的业务逻辑
3. 配置API密钥和参数

## 版本历史

- v1.0.0: 基础AI记事本功能实现
  - Markdown编辑器
  - AI智能整理
  - Todo提取
  - 三栏布局
  - 搜索筛选功能

## 贡献指南

1. Fork项目仓库
2. 创建功能分支
3. 实现新功能并添加测试
4. 提交Pull Request
5. 等待代码审查

## 许可证

本项目采用MIT许可证，详见LICENSE文件。