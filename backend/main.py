from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime
import logging

from config import settings
from routers import notes
# from utils.security import verify_token
# from middleware.logging import LoggingMiddleware
# from middleware.rate_limit import RateLimitMiddleware

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 安全配置
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    token = credentials.credentials
    try:
        payload = verify_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动事件
    logger.info("Starting AI Workbench API...")

    # 检查数据库连接
    try:
        from database import init_db
        await init_db()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

    # 检查Redis连接 (可选)
    # try:
    #     from utils.redis_client import init_redis
    #     await init_redis()
    #     logger.info("Redis connection established")
    # except Exception as e:
    #     logger.error(f"Redis connection failed: {str(e)}")
    #     raise

    yield

    # 关闭事件
    logger.info("Shutting down AI Workbench API...")

# 创建FastAPI应用
app = FastAPI(
    title="AI工作台 API",
    description="AI工作台后端API服务",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加日志中间件
# app.add_middleware(LoggingMiddleware)

# 添加限流中间件
# app.add_middleware(RateLimitMiddleware, calls=100, period=60)

# 注册路由
app.include_router(notes.router, prefix="/api/notes", tags=["记事本"])

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "欢迎使用AI工作台 API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ai-workbench-api",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )