# 测试配置和夹具
# 提供测试共享的配置和数据库夹具

import pytest
import asyncio
from datetime import datetime
from typing import Generator, Dict, Any
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from main import app
from database.base import Base
from database import get_db
from models.user import User
from models.note import Note, Todo, Tag, NoteVersion

# 测试数据库配置 - 使用内存数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# 创建测试引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# 创建会话工厂
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_db():
    """创建测试数据库"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    yield
    # 清理
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db) -> Generator[Session, None, None]:
    """创建数据库会话"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session) -> TestClient:
    """创建测试客户端"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture
def sample_note_data():
    """示例笔记数据"""
    return {
        "title": "测试笔记",
        "content": "这是一个测试笔记的内容"
    }


@pytest.fixture
def sample_todo_data():
    """示例Todo数据"""
    return {
        "content": "完成测试任务",
        "priority": "high"
    }


@pytest.fixture
def mock_ai_service():
    """模拟AI服务"""
    with patch('services.ai_service.AIService') as mock:
        # 配置模拟的 organize_note_content 方法
        mock_instance = Mock()
        mock.return_value = mock_instance

        mock_organized = Mock()
        mock_organized.title = "AI整理后的标题"
        mock_organized.content = "# AI整理后的内容\n\n这是AI整理后的笔记内容。"
        mock_organized.tags = ["AI整理", "结构化"]
        mock_organized.summary = "AI生成的摘要"
        mock_instance.organize_note_content.return_value = mock_organized

        # 配置模拟的 extract_todos_from_note 方法
        mock_extraction = Mock()
        mock_todo1 = Mock()
        mock_todo1.content = "完成任务1"
        mock_todo1.priority = "high"
        mock_todo2 = Mock()
        mock_todo2.content = "完成任务2"
        mock_todo2.priority = "medium"
        mock_extraction.todos = [mock_todo1, mock_todo2]
        mock_extraction.summary = "提取了2个任务"
        mock_instance.extract_todos_from_note.return_value = mock_extraction

        yield mock


@pytest.fixture
def sample_organized_content():
    """示例整理后的内容"""
    return {
        "title": "AI整理后的标题",
        "content": "# AI整理后的内容\n\n这是AI整理后的笔记内容。",
        "tags": ["AI整理", "结构化"],
        "summary": "AI生成的摘要"
    }


@pytest.fixture
def sample_todo_extraction():
    """示例Todo提取结果"""
    return {
        "todos": [
            {"content": "完成任务1", "priority": "high"},
            {"content": "完成任务2", "priority": "medium"}
        ],
        "summary": "提取了2个任务"
    }


@pytest.fixture
def auth_headers():
    """认证头信息"""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def create_test_note():
    """创建测试笔记的工厂函数"""
    def _create_note(db_session, title="测试笔记", content="测试内容", **kwargs):
        note = Note(
            title=title,
            content=content,
            **kwargs
        )
        note.calculate_stats()
        db_session.add(note)
        db_session.commit()
        db_session.refresh(note)
        return note
    return _create_note


@pytest.fixture
def create_test_todo():
    """创建测试Todo的工厂函数"""
    def _create_todo(db_session, note_id, content="测试任务", priority="medium", **kwargs):
        todo = Todo(
            note_id=note_id,
            content=content,
            priority=priority,
            **kwargs
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)
        return todo
    return _create_todo


@pytest.fixture
def create_test_user():
    """创建测试用户的工厂函数"""
    def _create_user(db_session, username="testuser", email="test@example.com", **kwargs):
        user = User(
            username=username,
            email=email,
            hashed_password="test_password_hash",
            **kwargs
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    return _create_user


class AsyncMock(Mock):
    """异步模拟类"""
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)