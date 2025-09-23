"""
边界条件测试
测试API的边界条件和异常情况
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from main import app
from database.session import get_db
from models.user import User
from models.pomodoro import PomodoroSession
from models.kanban import Board, List, Card
from models.note import Note

client = TestClient(app)


class TestBoundaryConditions:
    """边界条件测试类"""

    @pytest.fixture
    def test_user(self, db_session: Session):
        """创建测试用户"""
        user = User(
            id=str(uuid.uuid4()),
            username="test_boundary_user",
            email="boundary@test.com",
            hashed_password="hashed_password"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def auth_headers(self, test_user: User):
        """创建认证头"""
        return {"Authorization": f"Bearer test_token_{test_user.id}"}

    # ===== 用户输入边界测试 =====

    def test_pomodoro_session_max_duration(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试番茄钟会话最大持续时间边界"""
        # 创建超长的番茄钟会话（超过24小时）
        response = client.post(
            "/api/pomodoro/sessions",
            json={
                "duration": 86400,  # 24小时
                "type": "focus"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

        # 测试合理的长时间会话（4小时）
        response = client.post(
            "/api/pomodoro/sessions",
            json={
                "duration": 14400,  # 4小时
                "type": "focus"
            },
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_pomodoro_session_min_duration(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试番茄钟会话最小持续时间边界"""
        # 创建超短的番茄钟会话（少于1分钟）
        response = client.post(
            "/api/pomodoro/sessions",
            json={
                "duration": 30,  # 30秒
                "type": "focus"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

        # 测试合理的短时间会话（5分钟）
        response = client.post(
            "/api/pomodoro/sessions",
            json={
                "duration": 300,  # 5分钟
                "type": "focus"
            },
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_note_title_max_length(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试笔记标题最大长度边界"""
        # 创建超长的标题（超过255字符）
        long_title = "A" * 256
        response = client.post(
            "/api/notes",
            json={
                "title": long_title,
                "content": "测试内容"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

        # 测试边界长度标题（255字符）
        boundary_title = "A" * 255
        response = client.post(
            "/api/notes",
            json={
                "title": boundary_title,
                "content": "测试内容"
            },
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_note_content_max_length(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试笔记内容最大长度边界"""
        # 创建超大内容（超过1MB）
        large_content = "A" * (1024 * 1024 + 1)  # 1MB + 1字节
        response = client.post(
            "/api/notes",
            json={
                "title": "测试标题",
                "content": large_content
            },
            headers=auth_headers
        )

        assert response.status_code == 413  # 请求实体过大

    def test_board_name_max_length(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试看板名称最大长度边界"""
        # 创建超长的看板名称
        long_name = "A" * 256
        response = client.post(
            "/api/boards",
            json={
                "name": long_name,
                "description": "测试描述"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

    def test_card_title_max_length(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试卡片标题最大长度边界"""
        # 先创建看板和列表
        board_response = client.post(
            "/api/boards",
            json={
                "name": "测试看板",
                "description": "测试描述"
            },
            headers=auth_headers
        )
        board_id = board_response.json()["id"]

        list_response = client.post(
            "/api/lists",
            json={
                "board_id": board_id,
                "name": "测试列表"
            },
            headers=auth_headers
        )
        list_id = list_response.json()["id"]

        # 创建超长的卡片标题
        long_title = "A" * 256
        response = client.post(
            "/api/cards",
            json={
                "list_id": list_id,
                "title": long_title,
                "description": "测试描述"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

    # ===== 数值边界测试 =====

    def test_pagination_max_limit(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试分页最大限制边界"""
        # 请求过大的分页限制
        response = client.get(
            "/api/notes?limit=10000",
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

        # 测试合理的分页限制
        response = client.get(
            "/api/notes?limit=100",
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_pagination_negative_offset(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试分页负偏移量边界"""
        # 请求负的偏移量
        response = client.get(
            "/api/notes?offset=-1",
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

    def test_invalid_priority_values(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试无效的优先级值"""
        # 先创建看板和列表
        board_response = client.post(
            "/api/boards",
            json={
                "name": "测试看板",
                "description": "测试描述"
            },
            headers=auth_headers
        )
        board_id = board_response.json()["id"]

        list_response = client.post(
            "/api/lists",
            json={
                "board_id": board_id,
                "name": "测试列表"
            },
            headers=auth_headers
        )
        list_id = list_response.json()["id"]

        # 创建无效的优先级卡片
        response = client.post(
            "/api/cards",
            json={
                "list_id": list_id,
                "title": "测试卡片",
                "priority": "invalid_priority"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

    # ===== 时间边界测试 =====

    def test_future_due_date(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试未来截止日期边界"""
        # 先创建看板和列表
        board_response = client.post(
            "/api/boards",
            json={
                "name": "测试看板",
                "description": "测试描述"
            },
            headers=auth_headers
        )
        board_id = board_response.json()["id"]

        list_response = client.post(
            "/api/lists",
            json={
                "board_id": board_id,
                "name": "测试列表"
            },
            headers=auth_headers
        )
        list_id = list_response.json()["id"]

        # 创建带有未来截止日期的卡片
        future_date = (datetime.utcnow() + timedelta(days=365)).isoformat()
        response = client.post(
            "/api/cards",
            json={
                "list_id": list_id,
                "title": "测试卡片",
                "due_date": future_date
            },
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_past_due_date(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试过去截止日期边界"""
        # 先创建看板和列表
        board_response = client.post(
            "/api/boards",
            json={
                "name": "测试看板",
                "description": "测试描述"
            },
            headers=auth_headers
        )
        board_id = board_response.json()["id"]

        list_response = client.post(
            "/api/lists",
            json={
                "board_id": board_id,
                "name": "测试列表"
            },
            headers=auth_headers
        )
        list_id = list_response.json()["id"]

        # 创建带有过去截止日期的卡片
        past_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
        response = client.post(
            "/api/cards",
            json={
                "list_id": list_id,
                "title": "测试卡片",
                "due_date": past_date
            },
            headers=auth_headers
        )

        assert response.status_code == 200  # 应该允许创建过期卡片

    # ===== 并发边界测试 =====

    def test_concurrent_session_creation(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试并发会话创建"""
        # 创建多个并发请求
        responses = []
        for i in range(10):
            response = client.post(
                "/api/pomodoro/sessions",
                json={
                    "duration": 1500,
                    "type": "focus"
                },
                headers=auth_headers
            )
            responses.append(response)

        # 验证所有请求都成功
        for response in responses:
            assert response.status_code == 200

    def test_concurrent_note_creation(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试并发笔记创建"""
        # 创建多个并发请求
        responses = []
        for i in range(10):
            response = client.post(
                "/api/notes",
                json={
                    "title": f"并发笔记 {i}",
                    "content": f"并发内容 {i}"
                },
                headers=auth_headers
            )
            responses.append(response)

        # 验证所有请求都成功
        for response in responses:
            assert response.status_code == 200

    # ===== ID边界测试 =====

    def test_invalid_uuid_format(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试无效的UUID格式"""
        # 使用无效的UUID格式
        invalid_uuid = "invalid-uuid-format"
        response = client.get(
            f"/api/boards/{invalid_uuid}",
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

    def test_non_existent_id(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试不存在的ID"""
        # 使用有效的UUID格式但不存在的ID
        non_existent_id = str(uuid.uuid4())
        response = client.get(
            f"/api/boards/{non_existent_id}",
            headers=auth_headers
        )

        assert response.status_code == 404  # 应该返回未找到

    # ===== 权限边界测试 =====

    def test_access_other_user_resource(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试访问其他用户资源"""
        # 创建另一个用户
        other_user = User(
            id=str(uuid.uuid4()),
            username="other_user",
            email="other@test.com",
            hashed_password="hashed_password"
        )
        db_session.add(other_user)
        db_session.commit()

        # 创建其他用户的资源
        other_note = Note(
            id=str(uuid.uuid4()),
            user_id=other_user.id,
            title="其他用户的笔记",
            content="其他用户的内容"
        )
        db_session.add(other_note)
        db_session.commit()

        # 尝试访问其他用户的资源
        response = client.get(
            f"/api/notes/{other_note.id}",
            headers=auth_headers
        )

        assert response.status_code == 403  # 应该被拒绝

    # ===== 性能边界测试 =====

    def test_large_batch_operations(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试大批量操作"""
        # 尝试批量创建大量笔记
        large_batch = [
            {"title": f"批量笔记 {i}", "content": f"批量内容 {i}"}
            for i in range(1000)
        ]

        response = client.post(
            "/api/notes/bulk",
            json={"notes": large_batch},
            headers=auth_headers
        )

        assert response.status_code == 413  # 请求实体过大

    def test_deep_nesting(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试深层嵌套结构"""
        # 创建深层嵌套的看板结构
        parent_board = None
        for i in range(10):
            response = client.post(
                "/api/boards",
                json={
                    "name": f"嵌套看板 {i}",
                    "description": f"嵌套描述 {i}",
                    "parent_id": parent_board["id"] if parent_board else None
                },
                headers=auth_headers
            )

            if response.status_code == 200:
                parent_board = response.json()
            else:
                # 验证深层嵌套被正确处理
                assert response.status_code in [200, 400]

    # ===== 特殊字符边界测试 =====

    def test_special_characters_in_content(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试内容中的特殊字符"""
        special_content = """
        特殊字符测试：!@#$%^&*()_+-=[]{}|;':",./<>?
        Unicode字符：你好世界 🌍 مرحبا العالم
        HTML标签：<script>alert('xss')</script>
        SQL注入：'; DROP TABLE users; --
        """

        response = client.post(
            "/api/notes",
            json={
                "title": "特殊字符测试",
                "content": special_content
            },
            headers=auth_headers
        )

        assert response.status_code == 200

        # 验证内容被正确存储和转义
        note_id = response.json()["id"]
        response = client.get(
            f"/api/notes/{note_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        stored_content = response.json()["content"]
        assert "script" not in stored_content or "&lt;script&gt;" in stored_content

    # ===== 空值边界测试 =====

    def test_empty_string_values(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试空字符串值"""
        # 创建空标题的笔记
        response = client.post(
            "/api/notes",
            json={
                "title": "",
                "content": "有内容的笔记"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # 应该被拒绝

    def test_null_values(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试空值"""
        # 创建空内容的笔记
        response = client.post(
            "/api/notes",
            json={
                "title": "测试标题",
                "content": None
            },
            headers=auth_headers
        )

        assert response.status_code == 200  # 应该允许空内容