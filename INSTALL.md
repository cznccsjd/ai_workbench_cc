# AI工作台 - 快速安装指南

## 🚀 快速开始

### 📋 环境要求
- Python 3.11+
- Node.js 20.x+
- Git

### ⚡ 一键启动步骤

#### 1️⃣ 克隆项目
```bash
git clone <your-repository-url>
cd ai-workbench
```

#### 2️⃣ 配置环境变量
```bash
# 复制环境配置模板
cp .env.template .env
cp backend/.env.example backend/.env

# ⚠️ 重要：编辑 .env 文件，至少填入 KIMI_API_KEY
nano .env  # 或使用你喜欢的编辑器
```

#### 3️⃣ 启动后端服务
```bash
cd backend

# 🔴 重要：创建并激活虚拟环境 (遵循项目铁律)
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

#### 4️⃣ 启动前端服务
```bash
# 新开终端窗口
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 5️⃣ 访问应用
- 🌐 前端: http://localhost:3000
- 🔧 后端API: http://localhost:8000
- 📚 API文档: http://localhost:8000/docs

## 🎯 核心功能
- ✅ AI记事本 - 智能整理和任务提取
- ✅ AI对话 - Kimi大模型集成
- ✅ 番茄钟 - 专注时间管理
- ✅ 看板管理 - Trello风格项目管理
- ✅ 主题切换 - 多种精美主题
- ✅ 响应式设计 - 完美适配移动端

## ⚠️ 注意事项
1. **必须在虚拟环境中运行Python服务** (项目铁律)
2. **至少需要配置KIMI_API_KEY才能使用AI功能**
3. **首次运行会自动创建SQLite数据库**
4. **生产环境请使用PostgreSQL数据库**

## 🆘 常见问题
- 数据库连接失败：检查DATABASE_URL配置
- AI功能不可用：检查KIMI_API_KEY是否正确填写
- 虚拟环境问题：确保已激活venv并安装了所有依赖