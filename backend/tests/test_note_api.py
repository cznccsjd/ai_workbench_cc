/**
 * 记事本API测试
 * 测试笔记相关的API端点
 */

import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database.base import Base
from models.note import Note, Todo, Tag

# 测试数据库配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建测试数据库表
Base.metadata.create_all(bind=engine)

def override_get_db():
    """覆盖数据库依赖"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# 覆盖依赖
app.dependency_overrides[override_get_db] = override_get_db

client = TestClient(app)

class TestNoteAPI:
    """笔记API测试类"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """测试前清理数据库"""
        db = TestingSessionLocal()
        db.query(Todo).delete()
        db.query(Note).delete()
        db.query(Tag).delete()
        db.commit()
        db.close()

    def test_create_note(self):
        """测试创建笔记"""
        note_data = {
            "title": "测试笔记",
            "content": "这是一个测试笔记的内容"
        }

        response = client.post("/api/notes/", json=note_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == note_data["title"]
        assert data["content"] == note_data["content"]
        assert data["is_bookmarked"] is False
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_get_all_notes(self):
        """测试获取所有笔记"""
        # 先创建几个测试笔记
        notes_data = [
            {"title": "笔记1", "content": "内容1"},
            {"title": "笔记2", "content": "内容2"},
        ]

        for note_data in notes_data:
            client.post("/api/notes/", json=note_data)

        # 获取所有笔记
        response = client.get("/api/notes/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] == "笔记1"
        assert data[1]["title"] == "笔记2"

    def test_get_note_by_id(self):
        """测试获取单个笔记"""
        # 创建笔记
        note_data = {"title": "测试笔记", "content": "测试内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 获取单个笔记
        response = client.get(f"/api/notes/{note_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == note_id
        assert data["title"] == note_data["title"]
        assert data["content"] == note_data["content"]

    def test_get_nonexistent_note(self):
        """测试获取不存在的笔记"""
        response = client.get("/api/notes/nonexistent-id")

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

    def test_update_note(self):
        """测试更新笔记"""
        # 创建笔记
        note_data = {"title": "原始标题", "content": "原始内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 更新笔记
        update_data = {
            "title": "更新后的标题",
            "content": "更新后的内容",
            "is_bookmarked": True
        }

        response = client.put(f"/api/notes/{note_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["content"] == update_data["content"]
        assert data["is_bookmarked"] is True

    def test_delete_note(self):
        """测试删除笔记"""
        # 创建笔记
        note_data = {"title": "待删除笔记", "content": "内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 删除笔记
        response = client.delete(f"/api/notes/{note_id}")

        assert response.status_code == 200
        assert response.json()["message"] == "笔记删除成功"

        # 验证笔记已被删除
        get_response = client.get(f"/api/notes/{note_id}")
        assert get_response.status_code == 404

    def test_toggle_bookmark(self):
        """测试切换收藏状态"""
        # 创建笔记
        note_data = {"title": "测试收藏", "content": "内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 初始状态应该不是收藏
        assert create_response.json()["is_bookmarked"] is False

        # 切换收藏状态
        response = client.post(f"/api/notes/{note_id}/bookmark")

        assert response.status_code == 200
        assert response.json()["is_bookmarked"] is True

        # 再次切换
        response2 = client.post(f"/api/notes/{note_id}/bookmark")
        assert response2.json()["is_bookmarked"] is False

    @patch('services.ai_service.ai_service.organize_note_content')
    def test_organize_note(self, mock_organize):
        """测试AI整理笔记"""
        # 模拟AI服务响应
        mock_organize.return_value = Mock(
            title="AI整理后的标题",
            content="# AI整理后的内容\n\n这是AI整理后的笔记内容。",
            tags=["AI整理", "结构化"],
            summary="AI生成的摘要"
        )

        # 创建笔记
        note_data = {"title": "原始标题", "content": "原始内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 调用AI整理
        response = client.post(f"/api/notes/{note_id}/organize")

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "AI整理后的标题"
        assert "AI整理后的内容" in data["content"]
        assert "AI整理" in data["tags"]
        assert data["summary"] == "AI生成的摘要"

    @patch('services.ai_service.ai_service.extract_todos_from_note')
    def test_extract_todos(self, mock_extract):
        """测试AI提取Todo"""
        # 模拟AI服务响应
        mock_extract.return_value = Mock(
            todos=[
                Mock(content="完成任务1", priority="high"),
                Mock(content="完成任务2", priority="medium")
            ],
            summary="提取了2个任务"
        )

        # 创建笔记
        note_data = {"title": "测试Todo提取", "content": "需要完成任务1和任务2"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 调用AI提取Todo
        response = client.post(f"/api/notes/{note_id}/extract-todos")

        assert response.status_code == 200
        data = response.json()
        assert len(data["todos"]) == 2
        assert data["todos"][0]["content"] == "完成任务1"
        assert data["todos"][0]["priority"] == "high"
        assert data["summary"] == "提取了2个任务"

    def test_create_todo(self):
        """测试创建Todo事项"""
        # 创建笔记
        note_data = {"title": "测试笔记", "content": "内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 创建Todo
        todo_data = {
            "content": "新的Todo事项",
            "priority": "high"
        }

        response = client.post(f"/api/notes/{note_id}/todos", json=todo_data)

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == todo_data["content"]
        assert data["priority"] == todo_data["priority"]
        assert data["is_completed"] is False
        assert data["note_id"] == note_id

    def test_get_note_todos(self):
        """测试获取笔记的Todo列表"""
        # 创建笔记
        note_data = {"title": "测试笔记", "content": "内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        # 创建几个Todo
        todos_data = [
            {"content": "Todo 1", "priority": "high"},
            {"content": "Todo 2", "priority": "medium"},
        ]

        for todo_data in todos_data:
            client.post(f"/api/notes/{note_id}/todos", json=todo_data)

        # 获取Todo列表
        response = client.get(f"/api/notes/{note_id}/todos")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["content"] == "Todo 1"
        assert data[1]["content"] == "Todo 2"

    def test_toggle_todo(self):
        """测试切换Todo完成状态"""
        # 创建笔记和Todo
        note_data = {"title": "测试笔记", "content": "内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        todo_data = {"content": "测试Todo", "priority": "medium"}
        todo_response = client.post(f"/api/notes/{note_id}/todos", json=todo_data)
        todo_id = todo_response.json()["id"]

        # 初始状态应该未完成
        assert todo_response.json()["is_completed"] is False

        # 切换完成状态
        response = client.post(f"/api/notes/todos/{todo_id}/toggle")

        assert response.status_code == 200
        assert response.json()["is_completed"] is True

        # 再次切换
        response2 = client.post(f"/api/notes/todos/{todo_id}/toggle")
        assert response2.json()["is_completed"] is False

    def test_delete_todo(self):
        """测试删除Todo事项"""
        # 创建笔记和Todo
        note_data = {"title": "测试笔记", "content": "内容"}
        create_response = client.post("/api/notes/", json=note_data)
        note_id = create_response.json()["id"]

        todo_data = {"content": "待删除Todo", "priority": "medium"}
        todo_response = client.post(f"/api/notes/{note_id}/todos", json=todo_data)
        todo_id = todo_response.json()["id"]

        # 删除Todo
        response = client.delete(f"/api/notes/todos/{todo_id}")

        assert response.status_code == 200
        assert response.json()["message"] == "Todo删除成功"

        # 验证Todo已被删除
        todos_response = client.get(f"/api/notes/{note_id}/todos")
        assert len(todos_response.json()) == 0

    def test_search_notes(self):
        """测试搜索笔记"""
        # 创建几个测试笔记
        notes_data = [
            {"title": "Python编程", "content": "Python是一种编程语言"},
            {"title": "JavaScript开发", "content": "JavaScript用于前端开发"},
            {"title": "数据分析", "content": "使用Python进行数据分析"},
        ]

        for note_data in notes_data:
            client.post("/api/notes/", json=note_data)

        # 搜索包含"Python"的笔记
        response = client.get("/api/notes/?search=Python")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # 应该找到2个包含Python的笔记

    def test_notes_pagination(self):
        """测试笔记分页"""
        # 创建多个笔记
        for i in range(15):
            note_data = {"title": f"笔记{i+1}", "content": f"内容{i+1}"}
            client.post("/api/notes/", json=note_data)

        # 测试分页
        response = client.get("/api/notes/?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10

        response2 = client.get("/api/notes/?skip=10&limit=10")
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2) == 5  # 剩下的5个笔记

if __name__ == "__main__":
    pytest.main([__file__])