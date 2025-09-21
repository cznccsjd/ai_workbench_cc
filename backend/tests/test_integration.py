/**
 * 前后端集成测试
 * 测试前端和后端API的真实交互，包括数据流、错误处理、性能等
 */

import pytest
import asyncio
import json
import time
from typing import Dict, Any, List
from unittest.mock import Mock, patch, AsyncMock
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from main import app
from database.base import Base
from database import get_db
from models.note import Note, Todo, Tag, NoteVersion
from services.ai_service import AIService
from config import settings

# 测试数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
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
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db):
    """创建数据库会话"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_client(db_session):
    """创建测试客户端"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return AsyncClient(app=app, base_url="http://test")


@pytest.fixture
def sample_note_data():
    """示例笔记数据"""
    return {
        "title": "集成测试笔记",
        "content": "这是集成测试的笔记内容，包含一些测试数据。"
    }


@pytest.fixture
def sample_todo_data():
    """示例Todo数据"""
    return {
        "content": "完成集成测试",
        "priority": "high"
    }


@pytest.fixture
def mock_ai_service():
    """模拟AI服务"""
    with patch('services.ai_service.AIService') as mock:
        mock_instance = Mock()
        mock.return_value = mock_instance

        # 模拟AI整理响应
        mock_organized = Mock()
        mock_organized.title = "AI整理后的标题"
        mock_organized.content = "# AI整理后的内容\n\n这是AI整理后的笔记内容。"
        mock_organized.tags = ["AI整理", "结构化"]
        mock_organized.summary = "AI生成的摘要"
        mock_instance.organize_note_content.return_value = mock_organized

        # 模拟Todo提取响应
        mock_extraction = Mock()
        mock_todo1 = Mock()
        mock_todo1.content = "完成集成测试任务"
        mock_todo1.priority = "high"
        mock_todo2 = Mock()
        mock_todo2.content = "验证测试结果"
        mock_todo2.priority = "medium"
        mock_extraction.todos = [mock_todo1, mock_todo2]
        mock_extraction.summary = "提取了2个任务"
        mock_instance.extract_todos_from_note.return_value = mock_extraction

        yield mock


class TestFrontendBackendIntegration:
    """前后端集成测试类"""

    @pytest.mark.asyncio
    async def test_complete_note_workflow(self, test_client, sample_note_data):
        """测试完整的笔记工作流程"""
        # 1. 创建笔记
        create_response = await test_client.post("/api/notes/", json=sample_note_data)
        assert create_response.status_code == 200
        created_note = create_response.json()
        note_id = created_note["id"]

        # 验证创建结果
        assert created_note["title"] == sample_note_data["title"]
        assert created_note["content"] == sample_note_data["content"]
        assert created_note["word_count"] > 0
        assert created_note["reading_time"] > 0

        # 2. 获取笔记列表
        list_response = await test_client.get("/api/notes/")
        assert list_response.status_code == 200
        notes = list_response.json()
        assert len(notes) == 1
        assert notes[0]["id"] == note_id

        # 3. 获取单个笔记
        get_response = await test_client.get(f"/api/notes/{note_id}")
        assert get_response.status_code == 200
        retrieved_note = get_response.json()
        assert retrieved_note["id"] == note_id
        assert retrieved_note["title"] == sample_note_data["title"]

        # 4. 更新笔记
        update_data = {
            "title": "更新的标题",
            "content": "更新的内容",
            "is_bookmarked": True
        }
        update_response = await test_client.put(f"/api/notes/{note_id}", json=update_data)
        assert update_response.status_code == 200
        updated_note = update_response.json()
        assert updated_note["title"] == update_data["title"]
        assert updated_note["content"] == update_data["content"]
        assert updated_note["is_bookmarked"] is True

        # 5. 切换收藏状态
        bookmark_response = await test_client.post(f"/api/notes/{note_id}/bookmark")
        assert bookmark_response.status_code == 200
        assert bookmark_response.json()["is_bookmarked"] is False

        # 6. 删除笔记
        delete_response = await test_client.delete(f"/api/notes/{note_id}")
        assert delete_response.status_code == 200

        # 验证笔记已被删除
        get_deleted_response = await test_client.get(f"/api/notes/{note_id}")
        assert get_deleted_response.status_code == 404

    @pytest.mark.asyncio
    async def test_note_with_todos_workflow(self, test_client, sample_note_data, sample_todo_data):
        """测试包含Todo的笔记工作流程"""
        # 1. 创建笔记
        create_response = await test_client.post("/api/notes/", json=sample_note_data)
        assert create_response.status_code == 200
        note_id = create_response.json()["id"]

        # 2. 创建多个Todo
        todos_data = [
            {"content": "任务1", "priority": "high"},
            {"content": "任务2", "priority": "medium"},
            {"content": "任务3", "priority": "low"},
        ]

        created_todos = []
        for todo_data in todos_data:
            todo_response = await test_client.post(f"/api/notes/{note_id}/todos", json=todo_data)
            assert todo_response.status_code == 200
            created_todos.append(todo_response.json())

        # 3. 获取笔记的Todo列表
        todos_response = await test_client.get(f"/api/notes/{note_id}/todos")
        assert todos_response.status_code == 200
        todos = todos_response.json()
        assert len(todos) == 3

        # 验证Todo内容
        for i, todo in enumerate(todos):
            assert todo["content"] == todos_data[i]["content"]
            assert todo["priority"] == todos_data[i]["priority"]
            assert todo["is_completed"] is False

        # 4. 切换Todo完成状态
        for todo in created_todos:
            toggle_response = await test_client.post(f"/api/notes/todos/{todo['id']}/toggle")
            assert toggle_response.status_code == 200
            assert toggle_response.json()["is_completed"] is True

        # 5. 删除Todo
        for todo in created_todos:
            delete_response = await test_client.delete(f"/api/notes/todos/{todo['id']}")
            assert delete_response.status_code == 200

        # 验证所有Todo已被删除
        final_todos_response = await test_client.get(f"/api/notes/{note_id}/todos")
        assert len(final_todos_response.json()) == 0

        # 6. 清理：删除笔记
        await test_client.delete(f"/api/notes/{note_id}")

    @pytest.mark.asyncio
    async def test_ai_organize_integration(self, test_client, sample_note_data, mock_ai_service):
        """测试AI整理功能的集成"""
        # 创建笔记
        create_response = await test_client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 调用AI整理
        organize_response = await test_client.post(f"/api/notes/{note_id}/organize")
        assert organize_response.status_code == 200

        organized_content = organize_response.json()
        assert organized_content["title"] == "AI整理后的标题"
        assert "AI整理后的内容" in organized_content["content"]
        assert "AI整理" in organized_content["tags"]
        assert organized_content["summary"] == "AI生成的摘要"

        # 验证笔记被更新
        get_response = await test_client.get(f"/api/notes/{note_id}")
        updated_note = get_response.json()
        assert updated_note["title"] == "AI整理后的标题"

        # 清理
        await test_client.delete(f"/api/notes/{note_id}")

    @pytest.mark.asyncio
    async def test_ai_todo_extraction_integration(self, test_client, sample_note_data, mock_ai_service):
        """测试AI Todo提取功能的集成"""
        # 创建包含任务的笔记
        note_data = {
            "title": "项目会议记录",
            "content": "今天我们讨论了以下任务：1. 完成项目文档编写 2. 进行代码审查 3. 更新项目进度"
        }

        create_response = await test_client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 调用AI提取Todo
        extract_response = await test_client.post(f"/api/notes/{note_id}/extract-todos")
        assert extract_response.status_code == 200

        extraction_result = extract_response.json()
        assert len(extraction_result["todos"]) == 2
        assert extraction_result["todos"][0]["content"] == "完成集成测试任务"
        assert extraction_result["todos"][0]["priority"] == "high"
        assert extraction_result["summary"] == "提取了2个任务"

        # 验证Todo被创建
        todos_response = await test_client.get(f"/api/notes/{note_id}/todos")
        assert len(todos_response.json()) == 2

        # 清理
        await test_client.delete(f"/api/notes/{note_id}")

    @pytest.mark.asyncio
    async def test_search_and_filter_integration(self, test_client):
        """测试搜索和过滤功能的集成"""
        # 创建多个笔记
        notes_data = [
            {"title": "Python编程指南", "content": "Python是一种强大的编程语言"},
            {"title": "JavaScript开发", "content": "JavaScript用于前端开发"},
            {"title": "Python数据分析", "content": "使用Python进行数据分析"},
            {"title": "机器学习基础", "content": "深度学习框架比较"},
            {"title": "Python Web开发", "content": "Django和Flask框架"},
        ]

        created_notes = []
        for note_data in notes_data:
            response = await test_client.post("/api/notes/", json=note_data)
            created_notes.append(response.json())

        # 测试搜索功能
        search_response = await test_client.get("/api/notes/?search=Python")
        assert search_response.status_code == 200
        python_notes = search_response.json()
        assert len(python_notes) == 3  # 应该找到3个包含Python的笔记

        # 测试分页功能
        paginated_response = await test_client.get("/api/notes/?skip=0&limit=2")
        assert paginated_response.status_code == 200
        paginated_notes = paginated_response.json()
        assert len(paginated_notes) == 2

        # 测试排序功能
        sorted_response = await test_client.get("/api/notes/?sort_by=title&sort_order=asc")
        assert sorted_response.status_code == 200
        sorted_notes = sorted_response.json()
        assert sorted_notes[0]["title"] == "JavaScript开发"

        # 清理
        for note in created_notes:
            await test_client.delete(f"/api/notes/{note['id']}")

    @pytest.mark.asyncio
    async def test_concurrent_operations_integration(self, test_client, sample_note_data):
        """测试并发操作的集成"""
        # 创建多个笔记
        notes_data = [
            {"title": f"并发测试笔记{i}", "content": f"这是第{i}个并发测试笔记"}
            for i in range(10)
        ]

        # 并发创建笔记
        import asyncio
        create_tasks = [
            test_client.post("/api/notes/", json=note_data)
            for note_data in notes_data
        ]

        create_responses = await asyncio.gather(*create_tasks)
        created_notes = [response.json() for response in create_responses]

        # 验证所有笔记都被创建
        assert len(created_notes) == 10
        assert all(response.status_code == 200 for response in create_responses)

        # 验证笔记ID都是唯一的
        note_ids = [note["id"] for note in created_notes]
        assert len(set(note_ids)) == 10

        # 并发更新笔记
        update_tasks = [
            test_client.put(f"/api/notes/{note['id']}", json={
                "title": f"更新后的笔记{i}",
                "content": f"这是更新后的内容{i}"
            })
            for i, note in enumerate(created_notes)
        ]

        update_responses = await asyncio.gather(*update_tasks)
        assert all(response.status_code == 200 for response in update_responses)

        # 清理
        delete_tasks = [
            test_client.delete(f"/api/notes/{note['id']}")
            for note in created_notes
        ]
        await asyncio.gather(*delete_tasks)

    @pytest.mark.asyncio
    async def test_error_handling_integration(self, test_client):
        """测试错误处理的集成"""
        # 测试获取不存在的笔记
        response = await test_client.get("/api/notes/nonexistent-id")
        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

        # 测试更新不存在的笔记
        update_response = await test_client.put("/api/notes/nonexistent-id", json={
            "title": "新标题",
            "content": "新内容"
        })
        assert update_response.status_code == 404

        # 测试删除不存在的笔记
        delete_response = await test_client.delete("/api/notes/nonexistent-id")
        assert delete_response.status_code == 404

        # 测试为不存在的笔记创建Todo
        todo_response = await test_client.post("/api/notes/nonexistent-id/todos", json={
            "content": "测试任务",
            "priority": "medium"
        })
        assert todo_response.status_code == 404

        # 测试切换不存在的Todo状态
        toggle_response = await test_client.post("/api/notes/todos/nonexistent-id/toggle")
        assert toggle_response.status_code == 404

    @pytest.mark.asyncio
    async def test_data_consistency_integration(self, test_client, sample_note_data):
        """测试数据一致性的集成"""
        # 创建笔记
        create_response = await test_client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 创建Todo
        todo_response = await test_client.post(f"/api/notes/{note_id}/todos", json={
            "content": "测试任务",
            "priority": "high"
        })
        todo_id = todo_response.json()["id"]

        # 验证笔记和Todo的关联
        note_response = await test_client.get(f"/api/notes/{note_id}")
        note = note_response.json()

        todos_response = await test_client.get(f"/api/notes/{note_id}/todos")
        todos = todos_response.json()

        assert len(todos) == 1
        assert todos[0]["note_id"] == note_id

        # 删除笔记后验证Todo也被删除
        await test_client.delete(f"/api/notes/{note_id}")

        # 尝试获取已删除笔记的Todo
        todos_after_delete = await test_client.get(f"/api/notes/{note_id}/todos")
        assert todos_after_delete.status_code == 404

    @pytest.mark.asyncio
    async def test_performance_integration(self, test_client):
        """测试性能的集成"""
        # 创建大量笔记
        start_time = time.time()
        notes_data = [
            {"title": f"性能测试笔记{i}", "content": f"这是第{i}个性能测试笔记的内容"}
            for i in range(100)
        ]

        for note_data in notes_data:
            response = await test_client.post("/api/notes/", json=note_data)
            assert response.status_code == 200

        creation_time = time.time() - start_time
        print(f"创建100个笔记耗时: {creation_time:.2f}秒")

        # 测试获取列表性能
        start_time = time.time()
        list_response = await test_client.get("/api/notes/")
        list_time = time.time() - start_time
        print(f"获取100个笔记列表耗时: {list_time:.2f}秒")

        assert list_response.status_code == 200
        assert len(list_response.json()) == 100

        # 性能要求：创建100个笔记应该小于10秒，获取列表应该小于1秒
        assert creation_time < 10.0, f"创建性能过慢: {creation_time}秒"
        assert list_time < 1.0, f"列表获取性能过慢: {list_time}秒"

        # 清理
        notes = list_response.json()
        for note in notes:
            await test_client.delete(f"/api/notes/{note['id']}")

    @pytest.mark.asyncio
    async def test_memory_usage_integration(self, test_client):
        """测试内存使用的集成"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # 创建包含大内容的笔记
        large_content = "这是大量内容。" * 1000  # 约20KB的内容
        note_data = {
            "title": "大内容测试",
            "content": large_content
        }

        # 创建多个大内容笔记
        for i in range(50):
            current_note_data = {
                **note_data,
                "title": f"大内容测试{i}",
                "content": f"{large_content} - 笔记{i}"
            }
            response = await test_client.post("/api/notes/", json=current_note_data)
            assert response.status_code == 200

        # 检查内存使用
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        print(f"初始内存使用: {initial_memory:.2f}MB")
        print(f"最终内存使用: {final_memory:.2f}MB")
        print(f"内存增加: {memory_increase:.2f}MB")

        # 内存使用应该合理（增加不超过100MB）
        assert memory_increase < 100, f"内存使用过高: {memory_increase}MB"

        # 清理
        list_response = await test_client.get("/api/notes/")
        notes = list_response.json()
        for note in notes:
            await test_client.delete(f"/api/notes/{note['id']}")


class TestRealAPIEndpoints:
    """真实API端点测试类"""

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self, test_client):
        """测试健康检查端点"""
        response = await test_client.get("/health")
        assert response.status_code == 200

        health_data = response.json()
        assert health_data["status"] == "healthy"
        assert health_data["service"] == "ai-workbench-api"
        assert health_data["version"] == "1.0.0"
        assert "timestamp" in health_data

    @pytest.mark.asyncio
    async def test_root_endpoint(self, test_client):
        """测试根端点"""
        response = await test_client.get("/")
        assert response.status_code == 200

        root_data = response.json()
        assert "欢迎使用AI工作台 API" in root_data["message"]
        assert root_data["version"] == "1.0.0"
        assert "/docs" in root_data["docs"]
        assert "/health" in root_data["health"]

    @pytest.mark.asyncio
    async def test_api_docs_accessible(self, test_client):
        """测试API文档可访问"""
        response = await test_client.get("/docs")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_openapi_schema(self, test_client):
        """测试OpenAPI模式"""
        response = await test_client.get("/openapi.json")
        assert response.status_code == 200

        openapi_data = response.json()
        assert "openapi" in openapi_data
        assert "info" in openapi_data
        assert "paths" in openapi_data
        assert "/api/notes/" in openapi_data["paths"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])