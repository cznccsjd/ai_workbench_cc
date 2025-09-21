# 记事本API测试
# 测试笔记相关的API端点，包括CRUD操作、AI整理、Todo提取等功能

import pytest
import json
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from main import app
from models.note import Note, Todo, Tag, NoteVersion
from services.ai_service import AIService, OrganizedContent, TodoExtractionResult, ExtractedTodo


class TestNoteAPI:
    """笔记API测试类"""

    def test_create_note_success(self, client, sample_note_data):
        """测试成功创建笔记"""
        response = client.post("/api/notes/", json=sample_note_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == sample_note_data["title"]
        assert data["content"] == sample_note_data["content"]
        assert data["is_bookmarked"] is False
        assert data["word_count"] > 0
        assert data["reading_time"] > 0
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_note_empty_content(self, client):
        """测试创建空内容笔记"""
        note_data = {"title": "空内容笔记", "content": ""}
        response = client.post("/api/notes/", json=note_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == note_data["title"]
        assert data["content"] == ""
        assert data["word_count"] == 0
        assert data["reading_time"] == 0

    def test_create_note_missing_title(self, client):
        """测试创建缺失标题的笔记"""
        note_data = {"content": "只有内容没有标题"}
        response = client.post("/api/notes/", json=note_data)

        assert response.status_code == 422  # FastAPI验证错误

    def test_create_note_invalid_data(self, client):
        """测试创建包含无效数据的笔记"""
        note_data = {"title": "", "content": "测试内容"}
        response = client.post("/api/notes/", json=note_data)

        assert response.status_code == 200  # 空标题应该被允许

    def test_get_all_notes_empty(self, client):
        """测试获取空笔记列表"""
        response = client.get("/api/notes/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_all_notes_with_data(self, client, sample_note_data):
        """测试获取包含数据的笔记列表"""
        # 创建几个测试笔记
        notes_data = [
            {"title": "笔记1", "content": "内容1"},
            {"title": "笔记2", "content": "内容2"},
            {"title": "笔记3", "content": "内容3"},
        ]

        for note_data in notes_data:
            client.post("/api/notes/", json=note_data)

        # 获取所有笔记
        response = client.get("/api/notes/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["title"] == "笔记1"
        assert data[1]["title"] == "笔记2"
        assert data[2]["title"] == "笔记3"

    def test_get_notes_with_pagination(self, client):
        """测试笔记分页功能"""
        # 创建15个笔记
        for i in range(15):
            note_data = {"title": f"笔记{i+1}", "content": f"内容{i+1}"}
            client.post("/api/notes/", json=note_data)

        # 测试第一页
        response = client.get("/api/notes/?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10
        assert data[0]["title"] == "笔记1"
        assert data[9]["title"] == "笔记10"

        # 测试第二页
        response = client.get("/api/notes/?skip=10&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        assert data[0]["title"] == "笔记11"
        assert data[4]["title"] == "笔记15"

    def test_get_notes_with_search(self, client):
        """测试笔记搜索功能"""
        # 创建测试笔记
        notes_data = [
            {"title": "Python编程指南", "content": "Python是一种强大的编程语言"},
            {"title": "JavaScript开发", "content": "JavaScript用于前端开发"},
            {"title": "数据分析", "content": "使用Python进行数据分析"},
            {"title": "机器学习", "content": "深度学习框架比较"},
        ]

        for note_data in notes_data:
            client.post("/api/notes/", json=note_data)

        # 搜索包含"Python"的笔记
        response = client.get("/api/notes/?search=Python")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # 应该找到2个包含Python的笔记

        # 搜索包含"开发"的笔记
        response = client.get("/api/notes/?search=开发")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # 应该找到2个包含"开发"的笔记

        # 搜索不存在的内容
        response = client.get("/api/notes/?search=不存在的搜索词")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    def test_get_notes_with_bookmark_filter(self, client):
        """测试收藏笔记过滤"""
        # 创建笔记
        note1 = {"title": "收藏笔记1", "content": "内容1"}
        note2 = {"title": "普通笔记", "content": "内容2"}
        note3 = {"title": "收藏笔记2", "content": "内容3"}

        response1 = client.post("/api/notes/", json=note1)
        note1_id = response1.json()["id"]
        client.post("/api/notes/", json=note2)
        response3 = client.post("/api/notes/", json=note3)
        note3_id = response3.json()["id"]

        # 收藏笔记1和笔记3
        client.post(f"/api/notes/{note1_id}/bookmark")
        client.post(f"/api/notes/{note3_id}/bookmark")

        # 获取收藏的笔记
        response = client.get("/api/notes/?is_bookmarked=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(note["is_bookmarked"] for note in data)

        # 获取未收藏的笔记
        response = client.get("/api/notes/?is_bookmarked=false")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert not data[0]["is_bookmarked"]

    def test_get_notes_sorting(self, client):
        """测试笔记排序功能"""
        # 创建笔记
        notes_data = [
            {"title": "A笔记", "content": "内容A"},
            {"title": "C笔记", "content": "内容C"},
            {"title": "B笔记", "content": "内容B"},
        ]

        for note_data in notes_data:
            client.post("/api/notes/", json=note_data)

        # 按标题升序排序
        response = client.get("/api/notes/?sort_by=title&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["title"] == "A笔记"
        assert data[1]["title"] == "B笔记"
        assert data[2]["title"] == "C笔记"

        # 按标题降序排序
        response = client.get("/api/notes/?sort_by=title&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["title"] == "C笔记"
        assert data[1]["title"] == "B笔记"
        assert data[2]["title"] == "A笔记"

    def test_get_note_by_id_success(self, client, sample_note_data):
        """测试成功获取单个笔记"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 获取单个笔记
        response = client.get(f"/api/notes/{note_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == note_id
        assert data["title"] == sample_note_data["title"]
        assert data["content"] == sample_note_data["content"]

    def test_get_nonexistent_note(self, client):
        """测试获取不存在的笔记"""
        response = client.get("/api/notes/nonexistent-id")

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

    def test_update_note_success(self, client, sample_note_data):
        """测试成功更新笔记"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
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

        # 验证版本历史被创建
        response = client.get(f"/api/notes/{note_id}")
        updated_note = response.json()
        assert updated_note["updated_at"] != create_response.json()["updated_at"]

    def test_update_note_partial(self, client, sample_note_data):
        """测试部分更新笔记"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 只更新标题
        update_data = {"title": "只更新标题"}
        response = client.put(f"/api/notes/{note_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["content"] == sample_note_data["content"]  # 内容不变

    def test_update_nonexistent_note(self, client):
        """测试更新不存在的笔记"""
        update_data = {"title": "新标题", "content": "新内容"}
        response = client.put("/api/notes/nonexistent-id", json=update_data)

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

    def test_delete_note_success(self, client, sample_note_data):
        """测试成功删除笔记"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 删除笔记
        response = client.delete(f"/api/notes/{note_id}")

        assert response.status_code == 200
        assert response.json()["message"] == "笔记删除成功"

        # 验证笔记已被删除
        get_response = client.get(f"/api/notes/{note_id}")
        assert get_response.status_code == 404

    def test_delete_nonexistent_note(self, client):
        """测试删除不存在的笔记"""
        response = client.delete("/api/notes/nonexistent-id")

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

    def test_toggle_bookmark_success(self, client, sample_note_data):
        """测试成功切换收藏状态"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 初始状态应该不是收藏
        assert create_response.json()["is_bookmarked"] is False

        # 切换收藏状态
        response = client.post(f"/api/notes/{note_id}/bookmark")

        assert response.status_code == 200
        data = response.json()
        assert data["is_bookmarked"] is True

        # 再次切换
        response2 = client.post(f"/api/notes/{note_id}/bookmark")
        assert response2.json()["is_bookmarked"] is False

    def test_toggle_bookmark_nonexistent_note(self, client):
        """测试切换不存在笔记的收藏状态"""
        response = client.post("/api/notes/nonexistent-id/bookmark")

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

    @patch('services.ai_service.AIService.organize_note_content')
    def test_organize_note_success(self, mock_organize, client, sample_note_data, sample_organized_content):
        """测试成功AI整理笔记"""
        # 配置模拟AI服务
        mock_organized_content_obj = OrganizedContent(**sample_organized_content)
        mock_organize.return_value = mock_organized_content_obj

        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 调用AI整理
        response = client.post(f"/api/notes/{note_id}/organize")

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == sample_organized_content["title"]
        assert sample_organized_content["content"] in data["content"]
        assert data["tags"] == sample_organized_content["tags"]
        assert data["summary"] == sample_organized_content["summary"]

        # 验证AI服务被调用
        mock_organize.assert_called_once()

    @patch('services.ai_service.AIService.organize_note_content')
    def test_organize_note_nonexistent(self, mock_organize, client):
        """测试整理不存在的笔记"""
        response = client.post("/api/notes/nonexistent-id/organize")

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]
        mock_organize.assert_not_called()

    @patch('services.ai_service.AIService.organize_note_content')
    def test_organize_note_ai_error(self, mock_organize, client, sample_note_data):
        """测试AI服务出错时的整理"""
        # 配置AI服务抛出异常
        mock_organize.side_effect = Exception("AI服务错误")

        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 调用AI整理
        response = client.post(f"/api/notes/{note_id}/organize")

        assert response.status_code == 500
        assert "AI整理失败" in response.json()["detail"]

    @patch('services.ai_service.AIService.extract_todos_from_note')
    def test_extract_todos_success(self, mock_extract, client, sample_note_data, sample_todo_extraction):
        """测试成功AI提取Todo"""
        # 配置模拟AI服务
        todos = [ExtractedTodo(**todo) for todo in sample_todo_extraction["todos"]]
        mock_extraction_result = TodoExtractionResult(
            todos=todos,
            summary=sample_todo_extraction["summary"]
        )
        mock_extract.return_value = mock_extraction_result

        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 调用AI提取Todo
        response = client.post(f"/api/notes/{note_id}/extract-todos")

        assert response.status_code == 200
        data = response.json()
        assert len(data["todos"]) == len(sample_todo_extraction["todos"])
        assert data["todos"][0]["content"] == sample_todo_extraction["todos"][0]["content"]
        assert data["todos"][0]["priority"] == sample_todo_extraction["todos"][0]["priority"]
        assert data["summary"] == sample_todo_extraction["summary"]

        # 验证AI服务被调用
        mock_extract.assert_called_once()

    @patch('services.ai_service.AIService.extract_todos_from_note')
    def test_extract_todos_nonexistent_note(self, mock_extract, client):
        """测试从不存在笔记提取Todo"""
        response = client.post("/api/notes/nonexistent-id/extract-todos")

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]
        mock_extract.assert_not_called()

    def test_get_note_todos_empty(self, client, sample_note_data):
        """测试获取空Todo列表"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 获取Todo列表
        response = client.get(f"/api/notes/{note_id}/todos")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_create_todo_success(self, client, sample_note_data, sample_todo_data):
        """测试成功创建Todo事项"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 创建Todo
        response = client.post(f"/api/notes/{note_id}/todos", json=sample_todo_data)

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == sample_todo_data["content"]
        assert data["priority"] == sample_todo_data["priority"]
        assert data["is_completed"] is False
        assert data["note_id"] == note_id

    def test_create_todo_nonexistent_note(self, client, sample_todo_data):
        """测试为不存在笔记创建Todo"""
        response = client.post("/api/notes/nonexistent-id/todos", json=sample_todo_data)

        assert response.status_code == 404
        assert "笔记不存在" in response.json()["detail"]

    def test_create_todo_invalid_priority(self, client, sample_note_data):
        """测试创建包含无效优先级的Todo"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 创建包含无效优先级的Todo
        todo_data = {"content": "测试任务", "priority": "invalid"}
        response = client.post(f"/api/notes/{note_id}/todos", json=todo_data)

        # 应该仍然创建成功，使用默认值
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == todo_data["content"]
        # 优先级应该被设置为默认值

    def test_get_note_todos_with_data(self, client, sample_note_data, sample_todo_data):
        """测试获取包含数据的Todo列表"""
        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 创建几个Todo
        todos_data = [
            {"content": "Todo 1", "priority": "high"},
            {"content": "Todo 2", "priority": "medium"},
            {"content": "Todo 3", "priority": "low"},
        ]

        for todo_data in todos_data:
            client.post(f"/api/notes/{note_id}/todos", json=todo_data)

        # 获取Todo列表
        response = client.get(f"/api/notes/{note_id}/todos")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["content"] == "Todo 1"
        assert data[1]["content"] == "Todo 2"
        assert data[2]["content"] == "Todo 3"

    def test_toggle_todo_success(self, client, sample_note_data, sample_todo_data):
        """测试成功切换Todo完成状态"""
        # 创建笔记和Todo
        note_response = client.post("/api/notes/", json=sample_note_data)
        note_id = note_response.json()["id"]

        todo_response = client.post(f"/api/notes/{note_id}/todos", json=sample_todo_data)
        todo_id = todo_response.json()["id"]

        # 初始状态应该未完成
        assert todo_response.json()["is_completed"] is False

        # 切换完成状态
        response = client.post(f"/api/notes/todos/{todo_id}/toggle")

        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] is True

        # 再次切换
        response2 = client.post(f"/api/notes/todos/{todo_id}/toggle")
        assert response2.json()["is_completed"] is False

    def test_toggle_todo_nonexistent(self, client):
        """测试切换不存在Todo的状态"""
        response = client.post("/api/notes/todos/nonexistent-id/toggle")

        assert response.status_code == 404
        assert "Todo不存在" in response.json()["detail"]

    def test_delete_todo_success(self, client, sample_note_data, sample_todo_data):
        """测试成功删除Todo事项"""
        # 创建笔记和Todo
        note_response = client.post("/api/notes/", json=sample_note_data)
        note_id = note_response.json()["id"]

        todo_response = client.post(f"/api/notes/{note_id}/todos", json=sample_todo_data)
        todo_id = todo_response.json()["id"]

        # 删除Todo
        response = client.delete(f"/api/notes/todos/{todo_id}")

        assert response.status_code == 200
        assert response.json()["message"] == "Todo删除成功"

        # 验证Todo已被删除
        todos_response = client.get(f"/api/notes/{note_id}/todos")
        assert len(todos_response.json()) == 0

    def test_delete_todo_nonexistent(self, client):
        """测试删除不存在的Todo"""
        response = client.delete("/api/notes/todos/nonexistent-id")

        assert response.status_code == 404
        assert "Todo不存在" in response.json()["detail"]

    def test_error_handling_database_error(self, client, db_session, sample_note_data):
        """测试数据库错误处理"""
        # 模拟数据库错误
        with patch.object(db_session, 'commit', side_effect=Exception("Database error")):
            response = client.post("/api/notes/", json=sample_note_data)
            assert response.status_code == 500

    def test_error_handling_validation_error(self, client):
        """测试数据验证错误处理"""
        # 发送无效数据
        invalid_data = {"title": "测试", "content": None, "extra_field": "不应该存在"}
        response = client.post("/api/notes/", json=invalid_data)

        # FastAPI 应该处理验证错误
        assert response.status_code in [200, 422]

    def test_concurrent_note_creation(self, client, sample_note_data):
        """测试并发创建笔记"""
        import concurrent.futures

        def create_note():
            return client.post("/api/notes/", json=sample_note_data)

        # 并发创建5个笔记
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_note) for _ in range(5)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        # 所有请求都应该成功
        assert all(response.status_code == 200 for response in results)

        # 验证创建了5个不同的笔记
        note_ids = [response.json()["id"] for response in results]
        assert len(set(note_ids)) == 5  # 所有ID都不同

    def test_note_statistics_calculation(self, client):
        """测试笔记统计信息计算"""
        # 创建包含不同长度内容的笔记
        test_cases = [
            {"title": "空内容", "content": ""},
            {"title": "短内容", "content": "这是一个短内容。"},
            {"title": "长内容", "content": "这是一个很长的内容。" * 50},
        ]

        for note_data in test_cases:
            response = client.post("/api/notes/", json=note_data)
            assert response.status_code == 200
            data = response.json()

            # 验证统计信息
            assert "word_count" in data
            assert "reading_time" in data
            assert data["word_count"] >= 0
            assert data["reading_time"] >= 0

            if note_data["content"] == "":
                assert data["word_count"] == 0
                assert data["reading_time"] == 0
            else:
                assert data["word_count"] > 0
                assert data["reading_time"] > 0


class TestNoteAPIDatabaseOperations:
    """笔记API数据库操作测试类"""

    def test_note_creation_in_database(self, db_session, sample_note_data):
        """测试数据库中的笔记创建"""
        note = Note(**sample_note_data)
        note.calculate_stats()

        db_session.add(note)
        db_session.commit()
        db_session.refresh(note)

        # 验证笔记被正确创建
        assert note.id is not None
        assert note.title == sample_note_data["title"]
        assert note.content == sample_note_data["content"]
        assert note.word_count > 0
        assert note.reading_time > 0
        assert note.created_at is not None
        assert note.updated_at is not None

    def test_note_version_creation(self, db_session, sample_note_data):
        """测试笔记版本历史创建"""
        # 创建笔记
        note = Note(**sample_note_data)
        note.calculate_stats()
        db_session.add(note)
        db_session.commit()

        # 创建版本历史
        version = NoteVersion(
            note_id=note.id,
            title=note.title,
            content=note.content,
            version=1,
            change_summary="初始版本"
        )
        db_session.add(version)
        db_session.commit()

        # 验证版本被创建
        assert version.id is not None
        assert version.note_id == note.id
        assert version.version == 1
        assert version.change_summary == "初始版本"

    def test_todo_creation_and_completion(self, db_session, sample_note_data):
        """测试Todo创建和完成状态切换"""
        # 创建笔记
        note = Note(**sample_note_data)
        note.calculate_stats()
        db_session.add(note)
        db_session.commit()

        # 创建Todo
        todo = Todo(
            note_id=note.id,
            content="测试任务",
            priority="high"
        )
        db_session.add(todo)
        db_session.commit()

        # 验证初始状态
        assert todo.is_completed is False
        assert todo.completed_at is None

        # 切换完成状态
        todo.toggle_completion()
        db_session.commit()

        # 验证完成状态
        assert todo.is_completed is True
        assert todo.completed_at is not None

    def test_note_tag_relationship(self, db_session, sample_note_data):
        """测试笔记和标签的关系"""
        # 创建笔记
        note = Note(**sample_note_data)
        note.calculate_stats()
        db_session.add(note)
        db_session.commit()

        # 创建标签
        tag1 = Tag(name="测试标签1")
        tag2 = Tag(name="测试标签2")
        db_session.add(tag1)
        db_session.add(tag2)
        db_session.commit()

        # 关联标签到笔记
        note.tags.append(tag1)
        note.tags.append(tag2)
        db_session.commit()

        # 验证关联
        assert len(note.tags) == 2
        assert tag1 in note.tags
        assert tag2 in note.tags

        # 验证反向关联
        assert note in tag1.notes
        assert note in tag2.notes

    def test_cascade_delete(self, db_session, sample_note_data):
        """测试级联删除"""
        # 创建笔记
        note = Note(**sample_note_data)
        note.calculate_stats()
        db_session.add(note)
        db_session.commit()

        # 创建关联的Todo
        todo = Todo(
            note_id=note.id,
            content="测试任务",
            priority="medium"
        )
        db_session.add(todo)
        db_session.commit()

        # 删除笔记
        db_session.delete(note)
        db_session.commit()

        # 验证Todo也被删除
        deleted_todo = db_session.query(Todo).filter(Todo.id == todo.id).first()
        assert deleted_todo is None


class TestNoteAPIPerformance:
    """笔记API性能测试类"""

    @pytest.mark.parametrize("note_count", [10, 50, 100])
    def test_note_list_performance(self, client, note_count):
        """测试笔记列表性能"""
        import time

        # 创建大量笔记
        for i in range(note_count):
            note_data = {"title": f"性能测试笔记{i}", "content": f"这是第{i}个测试笔记的内容"}
            client.post("/api/notes/", json=note_data)

        # 测试获取列表性能
        start_time = time.time()
        response = client.get("/api/notes/")
        end_time = time.time()

        assert response.status_code == 200
        data = response.json()
        assert len(data) == note_count

        # 验证响应时间（应该小于1秒）
        response_time = end_time - start_time
        assert response_time < 1.0, f"响应时间过慢: {response_time}秒"

    def test_note_creation_performance(self, client, sample_note_data):
        """测试笔记创建性能"""
        import time

        # 测试创建性能
        start_time = time.time()
        response = client.post("/api/notes/", json=sample_note_data)
        end_time = time.time()

        assert response.status_code == 200

        # 验证响应时间（应该小于0.5秒）
        response_time = end_time - start_time
        assert response_time < 0.5, f"创建响应时间过慢: {response_time}秒"

    def test_ai_service_performance(self, client, sample_note_data):
        """测试AI服务性能"""
        import time

        # 创建笔记
        create_response = client.post("/api/notes/", json=sample_note_data)
        note_id = create_response.json()["id"]

        # 测试AI整理性能
        start_time = time.time()
        response = client.post(f"/api/notes/{note_id}/organize")
        end_time = time.time()

        assert response.status_code == 200

        # 验证AI响应时间（应该小于3秒）
        response_time = end_time - start_time
        assert response_time < 3.0, f"AI服务响应时间过慢: {response_time}秒"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])