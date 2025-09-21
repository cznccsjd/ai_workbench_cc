/**
 * 数据库基础配置
 */

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger(__name__)

# 创建Base类
Base = declarative_base()

# 数据库引擎和会话将在初始化时设置
engine = None
SessionLocal = None

async def init_db(database_url: str = None):
    """初始化数据库连接"""
    global engine, SessionLocal

    try:
        from config import settings

        # 使用提供的URL或配置中的URL
        db_url = database_url or settings.DATABASE_URL

        # 创建引擎
        engine = create_engine(
            db_url,
            echo=settings.DEBUG,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )

        # 创建会话工厂
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        # 创建所有表
        Base.metadata.create_all(bind=engine)

        logger.info("Database initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

def get_db():
    """获取数据库会话"""
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()