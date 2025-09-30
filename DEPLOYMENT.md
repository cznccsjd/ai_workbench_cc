# DEPLOYMENT.md: AI工作台 Vercel + Railway 部署方案

## 📋 项目架构概述

**前端**: Next.js + TypeScript + Tailwind CSS
**后端**: FastAPI + Python + PDM + PostgreSQL + Redis
**包管理**: PDM (Python Development Master) - 现代化Python包管理
**特点**: 完整的前后端分离架构，5大核心功能模块已完成

---

## ✅ Vercel + Railway 技术可行性评估

### 🌟 方案优势

1. **完美匹配**: Vercel专为Next.js优化，Railway原生支持Python应用
2. **自动化CI/CD**: 两平台都支持Git自动部署
3. **免费额度充足**: 个人项目完全够用
4. **全球CDN**: Vercel提供优秀的静态资源加速
5. **零配置部署**: 推送代码即自动部署
6. **生产级稳定**: 支持自定义域名和SSL证书

---

## 🔧 具体部署配置方案

### 1. 前端 (Vercel) 配置

#### 1.1 环境变量设置
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_ENV=production
```

#### 1.2 vercel.json 配置文件
```json
{
  "functions": {
    "app/[[...nextjs]]/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "$NEXT_PUBLIC_API_URL/$1"
    }
  ]
}
```

#### 1.3 构建配置
```bash
# Build Command
npm run build

# Output Directory
.next

# Install Command
npm install

# Development Command
npm run dev
```

---

### 2. 后端 (Railway) 配置

#### 2.1 环境变量设置
```env
DATABASE_URL=postgresql://user:password@host:port/db
REDIS_URL=redis://host:port
ALLOWED_ORIGINS=https://your-frontend.vercel.app
DEBUG=false
PORT=8000
PYTHON_VERSION=3.12
```

#### 2.2 railway.json 配置文件
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT"
  }
}
```

#### 2.3 Procfile (可选)
```procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 2.4 依赖管理（PDM）

本项目使用**PDM (Python Development Master)**管理依赖。Railway的Nixpacks会自动检测并支持PDM。

**部署文件**：
- `pyproject.toml` - PDM项目配置
- `pdm.lock` - 锁定的依赖版本
- `requirements.txt` - 导出的pip兼容文件（备份）

**Railway自动检测顺序**：
1. 检测到`pdm.lock` → 执行 `pdm install --prod`
2. 如无pdm.lock但有`requirements.txt` → 执行 `pip install -r requirements.txt`

**推荐配置**：确保backend目录包含：
```
backend/
├── pyproject.toml    # PDM配置
├── pdm.lock          # 锁文件
└── requirements.txt  # 导出的备份
```

---

## 💰 成本分析

### Vercel 免费额度
- **带宽**: 100GB/月
- **构建时间**: 6000分钟/月
- **边缘函数**: 100GB-小时/月
- **域名**: 免费 .vercel.app 子域名
- **SSL**: 自动配置和续期

### Railway 免费额度
- **运行时间**: $5免费额度/月
- **数据库**: 包含PostgreSQL服务
- **内存**: 最高512MB
- **存储**: 1GB
- **域名**: 免费 .railway.app 子域名

### 总成本评估
- **个人使用**: 完全免费
- **小型团队**: 月成本 < $20
- **商业项目**: 根据流量弹性计费

---

## 🔄 替代方案对比

| 方案 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| **Vercel + Railway** | 零配置、高性能、免费额度大 | 需要两个平台管理 | 推荐方案 |
| **Vercel + Supabase** | 数据库功能更强 | 数据库限制多、成本较高 | 数据密集型应用 |
| **Netlify + Render** | 配置简单、一站式 | 性能略逊、功能限制 | 简单应用 |
| **GitHub Pages + Heroku** | GitHub集成度高 | Heroku已收费、性能一般 | 不推荐 |

---

## ⚡ 快速部署步骤

### 步骤1: 前端部署 (约2分钟)

1. **连接GitHub仓库**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击 "Import Project" 选择AI工作台仓库

2. **配置构建设置**
   ```bash
   Framework Preset: Next.js
   Root Directory: frontend/
   Build Command: npm run build
   Output Directory: .next/
   ```

3. **设置环境变量**
   ```env
   NEXT_PUBLIC_API_URL=https://[your-app-name].railway.app
   ```

4. **部署完成**
   - 自动分配域名: `https://[project-name].vercel.app`
   - 后续推送自动重新部署

### 步骤2: 后端部署 (约3分钟)

1. **连接GitHub仓库**
   - 访问 [railway.app](https://railway.app)
   - 使用GitHub账号登录
   - 创建新项目并连接仓库

2. **配置服务设置**
   ```bash
   Root Directory: backend/
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **添加数据库服务**
   - 在项目中添加PostgreSQL插件
   - 系统自动生成DATABASE_URL环境变量

4. **设置环境变量**
   ```env
   ALLOWED_ORIGINS=https://[your-frontend].vercel.app
   DEBUG=false
   ```

### 步骤3: 域名配置 (约1分钟)

1. **自动分配域名**
   - Vercel: `https://[project-name].vercel.app`
   - Railway: `https://[project-name].railway.app`

2. **自定义域名**（可选）
   - 在各平台控制台添加自定义域名
   - 配置DNS CNAME记录
   - 自动配置SSL证书

---

## 🛠️ 部署后配置清单

### 前端配置验证
- [ ] 页面正常加载
- [ ] API请求能够正常访问后端
- [ ] 静态资源加载正常
- [ ] 响应式布局在移动端正常显示

### 后端配置验证
- [ ] API接口响应正常
- [ ] 数据库连接正常
- [ ] Redis缓存功能正常
- [ ] CORS配置正确，前端可正常调用

### 功能模块验证
- [ ] AI记事本智能整理功能正常
- [ ] 多模型AI聊天功能正常
- [ ] 番茄钟计时器功能正常
- [ ] 看板项目管理功能正常
- [ ] 思维导图工具功能正常

---

## 🔍 监控与维护

### 1. 性能监控
- **Vercel Analytics**: 自动提供Web Vitals指标
- **Railway Metrics**: CPU、内存、网络使用情况
- **错误追踪**: 通过应用日志监控异常

### 2. 日志管理
```bash
# Railway 查看实时日志
railway logs --tail

# Vercel 查看构建和运行日志
vercel logs [deployment-url]
```

### 3. 备份策略
- **数据库备份**: Railway自动每日备份PostgreSQL
- **代码备份**: GitHub仓库作为版本控制和代码备份
- **配置备份**: 定期导出环境变量配置

---

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 前端部署失败
```bash
# 检查构建配置
npm run build  # 本地测试构建
npm run lint    # 检查代码规范
```

#### 2. 后端启动失败
```bash
# 检查依赖安装
pip install -r requirements.txt
# 检查启动命令
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 3. 数据库连接问题
```python
# 检查数据库URL格式
DATABASE_URL=postgresql://username:password@host:port/database
```

#### 4. CORS错误
```python
# 确认后端CORS配置
ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]
```

---

## 🎯 推荐理由总结

### ✅ 选择Vercel + Railway的核心优势

1. **零成本起步**: 个人项目完全免费使用
2. **生产级性能**: 全球CDN + 自动扩缩容
3. **极简维护**: Git push自动部署，无需运维
4. **专业支持**: 支持自定义域名、SSL证书、监控告警
5. **技术匹配**: 完美支持Next.js + FastAPI技术栈
6. **扩展性强**: 随项目发展可无缝升级付费计划

### 🚀 适用场景

- **个人开发者**: 展示技术实力的作品集项目
- **初创团队**: 快速验证产品概念的MVP
- **企业内部工具**: 提高团队生产力的内部应用
- **开源项目**: 需要稳定演示环境的开源工具

---

## 📚 相关文档

- [Vercel部署文档](https://vercel.com/docs)
- [Railway部署指南](https://docs.railway.app)
- [Next.js部署最佳实践](https://nextjs.org/docs/deployment)
- [FastAPI部署指南](https://fastapi.tiangolo.com/deployment/)

---

**结论**: 这个方案完美匹配AI工作台项目架构，建议立即采用！

**最后更新**: 2025-09-24
**维护者**: AI工作台项目团队