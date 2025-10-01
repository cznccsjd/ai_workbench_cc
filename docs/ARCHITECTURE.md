# AI工作台系统架构设计文档

## 1. 系统整体架构

### 1.1 架构概览
AI工作台采用现代化的前后端分离架构，以微服务理念设计，确保系统的高可用性、可扩展性和可维护性。

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                     │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15 + TypeScript + Tailwind CSS + Zustand         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │  AI记事本    │  AI对话      │  番茄钟      │  项目管理    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              共享组件库 + 主题系统                      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API网关层 (Gateway)                     │
├─────────────────────────────────────────────────────────────┤
│                  FastAPI + Uvicorn服务器                    │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │  用户认证    │  记事本API   │  AI服务API  │  项目管理API │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              JWT认证 + 请求限频 + 日志系统              │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      数据持久化层 (Data)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────┐ │
│  │   PostgreSQL        │ │      Redis          │ │  文件  │ │
│  │  ┌───┬───┬───┬───┐ │ │ ┌───┬───┬───┬───┐ │ │ 存储  │ │
│  │  │用户│笔记│任务│项目│ │ │ │会话│缓存│队列│锁 │ │ │       │ │
│  │  └───┴───┴───┴───┘ │ │ └───┴───┴───┴───┘ │ │       │ │
│  └─────────────────────┘ └─────────────────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    外部服务层 (External)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────┐ │
│  │    Kimi AI API      │ │    文件存储         │ │ 通知服务│ │
│  │  (文本生成)         │ │  (AWS S3/本地)      │ │(WebPush)│ │
│  └─────────────────────┘ └─────────────────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选择理由

**前端技术栈：**
- **Next.js 15**: React 18服务端渲染框架，提供优秀的性能和SEO支持
- **TypeScript**: 静态类型检查，提高代码质量和开发效率
- **Tailwind CSS**: 原子化CSS框架，快速构建响应式界面
- **Zustand**: 轻量级状态管理，比Redux更简洁高效

**后端技术栈：**
- **FastAPI**: 现代Python Web框架，自动生成API文档，性能优异
- **PostgreSQL**: 强大的关系型数据库，支持复杂查询和事务
- **Redis**: 内存数据库，用于会话存储、缓存和消息队列
- **JWT**: 无状态认证机制，支持分布式部署

**部署技术：**
- **Docker**: 容器化部署，保证环境一致性
- **Nginx**: 反向代理和负载均衡
- **GitHub Actions**: CI/CD自动化流程

## 2. 前端架构设计

### 2.1 项目结构
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── globals.css        # 全局样式
│   └── favicon.ico
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── features/         # 功能组件
│   │   ├── ai-notepad/   # AI记事本
│   │   ├── ai-chat/      # AI对话
│   │   ├── pomodoro/     # 番茄钟
│   │   └── kanban/       # 项目管理
│   └── layouts/          # 布局组件
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/                  # 工具函数
│   ├── api.ts           # API调用封装
│   ├── utils.ts         # 通用工具函数
│   └── constants.ts     # 常量定义
├── hooks/               # 自定义Hooks
│   ├── useAuth.ts      # 认证相关
│   ├── useTheme.ts     # 主题切换
│   └── useApi.ts       # API调用
├── stores/              # Zustand状态管理
│   ├── authStore.ts    # 用户认证状态
│   ├── themeStore.ts   # 主题状态
│   └── appStore.ts     # 应用状态
├── types/               # TypeScript类型定义
│   ├── user.ts
│   ├── note.ts
│   └── project.ts
└── styles/              # 样式文件
    ├── themes/         # 主题配置
    └── globals.css
```

### 2.2 状态管理架构
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

// stores/themeStore.ts
interface ThemeState {
  currentTheme: Theme;
  availableThemes: Theme[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// stores/appStore.ts
interface AppState {
  // AI记事本状态
  notes: Note[];
  activeNote: Note | null;
  isEditing: boolean;

  // AI对话状态
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoading: boolean;

  // 番茄钟状态
  pomodoroState: PomodoroState;
  timer: number;
  isRunning: boolean;

  // 项目管理状态
  projects: Project[];
  activeProject: Project | null;
  kanbanData: KanbanData;
}
```

### 2.3 组件设计模式
```typescript
// 智能组件 (Container Components)
// 负责业务逻辑和状态管理
const AiNotepadContainer: React.FC = () => {
  const { notes, activeNote, createNote, updateNote } = useAppStore();
  const [content, setContent] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // 自动保存逻辑
    debounce(() => updateNote(activeNote.id, newContent), 1000);
  };

  return (
    <AiNotepad
      content={content}
      onContentChange={handleContentChange}
      notes={notes}
      activeNoteId={activeNote?.id}
    />
  );
};

// 展示组件 (Presentational Components)
// 只负责UI展示，不包含业务逻辑
interface AiNotepadProps {
  content: string;
  onContentChange: (content: string) => void;
  notes: Note[];
  activeNoteId?: string;
}

const AiNotepad: React.FC<AiNotepadProps> = ({
  content,
  onContentChange,
  notes,
  activeNoteId
}) => {
  return (
    <div className="ai-notepad">
      <NoteList notes={notes} activeNoteId={activeNoteId} />
      <MarkdownEditor
        value={content}
        onChange={onContentChange}
        placeholder="开始写作，AI将智能整理您的内容..."
      />
      <TodoPanel todos={extractTodos(content)} />
    </div>
  );
};
```

## 3. 后端架构设计

### 3.1 项目结构
```
src/
├── main.py              # 应用入口
├── config.py           # 配置文件
├── models/             # 数据模型
│   ├── __init__.py
│   ├── user.py         # 用户模型
│   ├── note.py         # 笔记模型
│   ├── task.py         # 任务模型
│   └── project.py      # 项目模型
├── schemas/            # Pydantic数据验证
│   ├── __init__.py
│   ├── user.py         # 用户数据模式
│   ├── note.py         # 笔记数据模式
│   └── project.py      # 项目数据模式
├── routers/            # API路由
│   ├── __init__.py
│   ├── auth.py         # 认证相关API
│   ├── users.py        # 用户管理API
│   ├── notes.py        # 记事本API
│   ├── ai.py           # AI服务API
│   ├── pomodoro.py     # 番茄钟API
│   └── projects.py     # 项目管理API
├── services/           # 业务逻辑层
│   ├── __init__.py
│   ├── auth.py         # 认证服务
│   ├── ai_service.py   # AI服务
│   ├── note_service.py # 记事本服务
│   └── project_service.py # 项目服务
├── utils/              # 工具函数
│   ├── __init__.py
│   ├── security.py     # 安全相关
│   ├── ai_client.py    # AI客户端
│   └── validators.py   # 数据验证
├── middleware/         # 中间件
│   ├── __init__.py
│   ├── auth.py         # 认证中间件
│   ├── logging.py      # 日志中间件
│   └── rate_limit.py   # 限流中间件
└── tests/              # 测试文件
    ├── __init__.py
    ├── conftest.py     # 测试配置
    ├── test_auth.py    # 认证测试
    ├── test_notes.py   # 记事本测试
    └── test_ai.py      # AI服务测试
```

### 3.2 核心服务设计

#### 3.2.1 认证服务
```python
# services/auth.py
class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

    def create_access_token(self, data: dict, expires_delta: timedelta = None):
        """创建JWT访问令牌"""
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """密码加密"""
        return self.pwd_context.hash(password)

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """用户认证"""
        user = await User.get_by_email(email)
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        return user
```

#### 3.2.2 AI服务
```python
# services/ai_service.py
class AIService:
    def __init__(self):
        self.kimi_client = KimiAIClient(api_key=settings.KIMI_API_KEY)
        self.openai_client = OpenAIClient(api_key=settings.OPENAI_API_KEY)
        self.model_manager = ModelManager()

    async def organize_notes(self, content: str) -> Dict[str, Any]:
        """AI智能整理笔记内容"""
        prompt = f"""
        请分析以下笔记内容，并按照以下格式整理：
        1. 提取关键信息点
        2. 生成简洁的摘要
        3. 提取待办事项（如果有）
        4. 建议相关标签

        笔记内容：
        {content}
        """

        response = await self.kimi_client.generate_text(prompt)
        return self.parse_organized_content(response)

    async def extract_todos(self, content: str) -> List[Dict[str, Any]]:
        """从笔记内容提取待办事项"""
        prompt = f"""
        从以下文本中提取所有待办事项，格式为：
        - 任务描述
        - 优先级（高/中/低）
        - 截止日期（如果有）

        文本内容：
        {content}
        """

        response = await self.kimi_client.generate_text(prompt)
        return self.parse_todo_items(response)

    async def chat_with_ai(self, message: str, context: List[Dict] = None) -> AsyncGenerator[str, None]:
        """与AI对话（流式响应）"""
        model = self.model_manager.get_active_model()

        async for chunk in model.stream_chat(message, context):
            yield chunk
```

### 3.3 数据库设计

#### 3.3.1 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### 3.3.2 记事本表 (notes)
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    summary TEXT,
    tags TEXT[], -- PostgreSQL数组类型
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    color VARCHAR(20) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_is_pinned ON notes(is_pinned);
```

#### 3.3.3 待办事项表 (todos)
```sql
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_note_id ON todos(note_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_due_date ON todos(due_date);
```

#### 3.3.4 项目表 (projects)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
```

#### 3.3.5 看板卡片表 (kanban_cards)
```sql
CREATE TABLE kanban_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    column_name VARCHAR(50) NOT NULL, -- 'todo', 'in_progress', 'done'
    position INTEGER NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    assignee_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    labels TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cards_project_id ON kanban_cards(project_id);
CREATE INDEX idx_cards_column ON kanban_cards(column_name);
CREATE INDEX idx_cards_position ON kanban_cards(position);
```

#### 3.3.6 番茄钟记录表 (pomodoro_sessions)
```sql
CREATE TABLE pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL, -- 分钟
    session_type VARCHAR(20) CHECK (session_type IN ('work', 'short_break', 'long_break')),
    status VARCHAR(20) CHECK (status IN ('completed', 'interrupted', 'cancelled')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    interruption_count INTEGER DEFAULT 0,
    note TEXT
);

CREATE INDEX idx_pomodoro_user_id ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_started_at ON pomodoro_sessions(started_at DESC);
```

## 4. API接口设计

### 4.1 认证相关API
```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

interface RegisterResponse {
  user: User;
  access_token: string;
  token_type: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  access_token: string;
  token_type: string;
}

// POST /api/auth/refresh
interface RefreshResponse {
  access_token: string;
  token_type: string;
}
```

### 4.2 记事本API
```typescript
// GET /api/notes
interface GetNotesRequest {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
}

interface GetNotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
}

// POST /api/notes
interface CreateNoteRequest {
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
}

interface CreateNoteResponse {
  note: Note;
}

// PUT /api/notes/{note_id}
interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  color?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

// POST /api/notes/{note_id}/organize
interface OrganizeNoteResponse {
  summary: string;
  todos: Todo[];
  tags: string[];
}
```

### 4.3 AI服务API
```typescript
// POST /api/ai/chat
interface ChatRequest {
  message: string;
  model?: string;
  context?: ChatMessage[];
}

interface ChatResponse {
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// POST /api/ai/chat/stream
interface StreamChatRequest {
  message: string;
  model?: string;
  context?: ChatMessage[];
}

// SSE流式响应
interface StreamChatResponse {
  content: string;
  is_final: boolean;
}

// GET /api/ai/models
interface GetModelsResponse {
  models: AIModel[];
  active_model: string;
}
```

### 4.4 项目管理API
```typescript
// GET /api/projects
interface GetProjectsResponse {
  projects: Project[];
}

// POST /api/projects
interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
  start_date?: string;
  end_date?: string;
}

// GET /api/projects/{project_id}/kanban
interface GetKanbanResponse {
  columns: KanbanColumn[];
  cards: KanbanCard[];
}

// POST /api/projects/{project_id}/cards
interface CreateCardRequest {
  title: string;
  description?: string;
  column_name: string;
  priority?: string;
  due_date?: string;
  labels?: string[];
}

// PUT /api/projects/{project_id}/cards/{card_id}/move
interface MoveCardRequest {
  column_name: string;
  position: number;
}
```

### 4.5 番茄钟API
```typescript
// POST /api/pomodoro/start
interface StartPomodoroRequest {
  duration: number; // 分钟
  session_type: 'work' | 'short_break' | 'long_break';
}

interface StartPomodoroResponse {
  session_id: string;
  started_at: string;
}

// POST /api/pomodoro/{session_id}/complete
interface CompletePomodoroRequest {
  status: 'completed' | 'interrupted' | 'cancelled';
  interruption_count?: number;
  note?: string;
}

// GET /api/pomodoro/stats
interface GetPomodoroStatsResponse {
  total_sessions: number;
  total_focus_time: number; // 分钟
  completed_sessions: number;
  average_session_duration: number;
  daily_stats: DailyPomodoroStat[];
}
```

## 5. 安全架构设计

### 5.1 认证与授权
```python
# middleware/auth.py
class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> str:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=403,
                    detail="Invalid authentication scheme."
                )
            try:
                payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
                email: str = payload.get("sub")
                if email is None:
                    raise HTTPException(
                        status_code=403,
                        detail="Invalid token payload."
                    )
                return email
            except JWTError:
                raise HTTPException(
                    status_code=403,
                    detail="Invalid token or expired token."
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Invalid authorization code."
            )
```

### 5.2 API限流
```python
# middleware/rate_limit.py
class RateLimitMiddleware:
    def __init__(self, app, calls: int = 100, period: int = 60):
        self.app = app
        self.calls = calls
        self.period = period
        self.clients = {}

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            client_ip = scope.get("client", ["unknown"])[0]

            now = time.time()
            if client_ip not in self.clients:
                self.clients[client_ip] = {"calls": [], "blocked": False}

            client_data = self.clients[client_ip]

            # 清理过期的调用记录
            client_data["calls"] = [
                call_time for call_time in client_data["calls"]
                if now - call_time < self.period
            ]

            # 检查是否超过限制
            if len(client_data["calls"]) >= self.calls:
                response = JSONResponse(
                    {"error": "Rate limit exceeded"},
                    status_code=429
                )
                await response(scope, receive, send)
                return

            # 记录当前调用
            client_data["calls"].append(now)

        await self.app(scope, receive, send)
```

### 5.3 数据加密
```python
# utils/security.py
class DataEncryption:
    def __init__(self):
        self.fernet = Fernet(settings.ENCRYPTION_KEY.encode())

    def encrypt_sensitive_data(self, data: str) -> str:
        """加密敏感数据"""
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """解密敏感数据"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()

    def hash_api_key(self, api_key: str) -> str:
        """API密钥哈希"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def verify_api_key(self, api_key: str, hashed_key: str) -> bool:
        """验证API密钥"""
        return self.hash_api_key(api_key) == hashed_key
```

## 6. 部署架构设计

### 6.1 Docker容器化
```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件并安装 (支持PDM)
COPY pyproject.toml pdm.lock* ./
RUN pip install --no-cache-dir pdm && \
    pdm install --prod --no-lock --no-editable

# 备用方案：使用requirements.txt
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY src/ ./src/
COPY main.py .
COPY config.py .

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM node:18-alpine AS runner

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

### 6.2 Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_workbench
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ai_workbench"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/ai_workbench
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - KIMI_API_KEY=${KIMI_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 6.3 环境配置
```bash
# .env.production
# 数据库配置
DB_USER=aiworkbench
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://aiworkbench:your_secure_password@postgres:5432/ai_workbench

# Redis配置
REDIS_URL=redis://redis:6379

# JWT配置
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI服务配置
KIMI_API_KEY=your_kimi_api_key
OPENAI_API_KEY=your_openai_api_key

# 文件上传配置
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760  # 10MB

# 邮件配置
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_email_password

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log
```

## 7. 监控与运维

### 7.1 健康检查
```python
# routers/health.py
@router.get("/health")
async def health_check():
    """系统健康检查"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }

    # 检查数据库连接
    try:
        await database.execute("SELECT 1")
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"

    # 检查Redis连接
    try:
        await redis_client.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"

    # 检查AI服务
    try:
        await ai_service.health_check()
        health_status["services"]["ai"] = "healthy"
    except Exception as e:
        health_status["services"]["ai"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)
```

### 7.2 性能监控
```python
# middleware/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

# 定义指标
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])

class MetricsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.time()

            # 获取请求信息
            method = scope["method"]
            path = scope["path"]

            # 包装send函数以捕获响应状态
            async def wrapped_send(message):
                if message["type"] == "http.response.start":
                    status = message["status"]

                    # 记录请求计数
                    request_count.labels(method=method, endpoint=path, status=status).inc()

                    # 记录请求时长
                    duration = time.time() - start_time
                    request_duration.labels(method=method, endpoint=path).observe(duration)

                await send(message)

            await self.app(scope, receive, wrapped_send)
        else:
            await self.app(scope, receive, send)
```

## 8. 性能优化策略

### 8.1 前端优化
- **代码分割**: 使用Next.js的动态导入实现路由级别的代码分割
- **图片优化**: 使用Next.js Image组件自动优化图片加载
- **缓存策略**: 实现Service Worker缓存静态资源
- **CDN加速**: 使用CDN加速静态资源分发
- **懒加载**: 对非关键组件实现懒加载

### 8.2 后端优化
- **数据库索引**: 为常用查询字段建立索引
- **连接池**: 使用数据库连接池减少连接开销
- **Redis缓存**: 缓存热点数据和会话信息
- **异步处理**: 使用Celery处理耗时任务
- **API分页**: 对列表接口实现分页

### 8.3 AI服务优化
- **请求缓存**: 缓存相似的AI请求结果
- **批量处理**: 合并多个AI请求进行批量处理
- **流式响应**: 使用Server-Sent Events实现流式响应
- **模型选择**: 根据任务复杂度选择合适的AI模型
- **失败重试**: 实现指数退避重试机制

## 9. 扩展性设计

### 9.1 水平扩展
- **无状态服务**: 应用服务设计为无状态，支持水平扩展
- **数据库分片**: 支持按用户ID进行数据库分片
- **负载均衡**: 使用Nginx实现应用层负载均衡
- **消息队列**: 使用Redis实现轻量级消息队列

### 9.2 插件化架构
- **AI模型插件**: 支持接入不同的AI模型
- **主题插件**: 支持动态添加新的主题
- **存储插件**: 支持多种文件存储方式
- **通知插件**: 支持多种通知渠道

## 10. 开发规范

### 10.1 代码规范
- **前端**: 遵循TypeScript和React最佳实践
- **后端**: 遵循PEP 8 Python编码规范
- **API**: 遵循RESTful API设计原则
- **数据库**: 遵循数据库设计范式

### 10.2 测试规范
- **单元测试**: 核心功能覆盖率>80%
- **集成测试**: 关键API接口全覆盖
- **E2E测试**: 核心用户流程全覆盖
- **性能测试**: 关键接口性能基准测试

### 10.3 文档规范
- **API文档**: 使用OpenAPI规范自动生成
- **代码注释**: 关键逻辑必须有详细注释
- **架构文档**: 保持架构文档的实时更新
- **部署文档**: 详细的部署和运维文档

---

**文档版本**: v1.0
**创建时间**: 2025-09-21
**最后更新**: 2025-09-21
**维护者**: 架构师
**审核者**: 项目经理