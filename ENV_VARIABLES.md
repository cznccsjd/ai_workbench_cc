# AI工作台部署环境变量配置清单

## 📋 后端环境变量 (Railway)

### 必需配置
```env
# 数据库连接 (Railway自动生成)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis连接 (如果使用Railway Redis插件会自动生成)
REDIS_URL=redis://host:port

# 安全密钥 (自己生成一个随机字符串)
SECRET_KEY=your-super-secret-key-change-this

# CORS允许的前端域名 (部署前端后填入Vercel域名)
ALLOWED_ORIGINS=https://your-app.vercel.app

# 应用配置
DEBUG=false
PORT=8000
```

### 可选配置
```env
# AI API密钥 (如果需要后端调用AI服务)
KIMI_API_KEY=your-kimi-api-key-here
```

---

## 🌐 前端环境变量 (Vercel)

### 必需配置
```env
# 后端API地址 (部署后端后填入Railway域名)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# 应用环境
NEXT_PUBLIC_APP_ENV=production
```

### 可选配置
```env
# 如果前端直接调用AI服务
NEXT_PUBLIC_KIMI_API_KEY=your-kimi-api-key
```

---

## 🔐 安全注意事项

1. **SECRET_KEY生成方法**:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. **DATABASE_URL**: Railway添加PostgreSQL插件后自动生成

3. **REDIS_URL**: Railway添加Redis插件后自动生成（可选）

4. **ALLOWED_ORIGINS**:
   - 开发阶段: `http://localhost:3000`
   - 生产环境: `https://your-app.vercel.app`
   - 多个域名用逗号分隔

5. **API密钥**: 不要提交到Git，仅在平台控制台配置

---

## 📝 部署顺序建议

1. **先部署后端** → 获取Railway域名
2. **配置前端环境变量** → 使用Railway域名
3. **再部署前端** → 获取Vercel域名
4. **回到后端配置CORS** → 添加Vercel域名到ALLOWED_ORIGINS

---

## ✅ 验证清单

- [ ] 后端DATABASE_URL已配置
- [ ] 后端SECRET_KEY已生成并配置
- [ ] 后端PORT设置为8000
- [ ] 后端DEBUG设置为false
- [ ] 前端NEXT_PUBLIC_API_URL指向正确的后端地址
- [ ] 后端ALLOWED_ORIGINS包含前端域名
- [ ] 所有敏感信息未提交到Git仓库
