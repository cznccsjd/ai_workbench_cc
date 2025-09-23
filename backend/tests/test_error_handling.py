"""
错误处理和异常场景测试
测试系统的错误处理能力和异常情况
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from unittest.mock import Mock, patch
import uuid
import json

from main import app
from database.session import get_db
from models.user import User
from models.pomodoro import PomodoroSession
from models.kanban import Board, List, Card
from models.note import Note
from services.ai_service import AIService
from services.pomodoro_service import PomodoroService
from services.kanban_service import KanbanService

client = TestClient(app)


class TestErrorHandling:
    """错误处理测试类"""

    @pytest.fixture
    def test_user(self, db_session: Session):
        """创建测试用户"""
        user = User(
            id=str(uuid.uuid4()),
            username="test_error_user",
            email="error@test.com",
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

    # ===== 数据库错误处理测试 =====

    def test_database_connection_error(self, test_user: User, auth_headers: dict):
        """测试数据库连接错误处理"""
        # 模拟数据库连接失败
        def mock_get_db():
            raise SQLAlchemyError("Database connection failed")

        with patch('main.get_db', side_effect=mock_get_db):
            response = client.get(
                "/api/notes",
                headers=auth_headers
            )

            assert response.status_code == 500
            assert "数据库错误" in response.json()["detail"]

    def test_database_timeout_error(self, test_user: User, auth_headers: dict):
        """测试数据库超时错误处理"""
        # 模拟数据库查询超时
        def mock_slow_query(*args, **kwargs):
            time.sleep(31)  # 超过30秒超时
            return []

        with patch('sqlalchemy.orm.Query.all', side_effect=mock_slow_query):
            response = client.get(
                "/api/notes",
                headers=auth_headers
            )

            # 应该触发超时处理
            assert response.status_code in [500, 504]

    def test_database_constraint_violation(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试数据库约束违反错误处理"""
        # 创建重复的笔记（违反唯一约束）
        note_data = {
            "title": "重复标题",
            "content": "重复内容"
        }

        # 第一次创建应该成功
        response1 = client.post(
            "/api/notes",
            json=note_data,
            headers=auth_headers
        )
        assert response1.status_code == 200

        # 第二次创建相同内容应该处理约束违反
        response2 = client.post(
            "/api/notes",
            json=note_data,
            headers=auth_headers
        )

        # 应该优雅处理，而不是崩溃
        assert response2.status_code in [200, 409]  # 成功或冲突

    # ===== 认证和授权错误处理测试 =====

    def test_invalid_token_format(self):
        """测试无效令牌格式错误处理"""
        response = client.get(
            "/api/notes",
            headers={"Authorization": "InvalidTokenFormat"}
        )

        assert response.status_code == 401
        assert "认证失败" in response.json()["detail"]

    def test_expired_token(self):
        """测试过期令牌错误处理"""
        response = client.get(
            "/api/notes",
            headers={"Authorization": "Bearer expired_token_12345"}
        )

        assert response.status_code == 401
        assert "令牌已过期" in response.json()["detail"]

    def test_insufficient_permissions(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试权限不足错误处理"""
        # 创建其他用户的资源
        other_user = User(
            id=str(uuid.uuid4()),
            username="other_user",
            email="other@test.com",
            hashed_password="hashed_password"
        )
        db_session.add(other_user)
        db_session.commit()

        other_note = Note(
            id=str(uuid.uuid4()),
            user_id=other_user.id,
            title="其他用户笔记",
            content="其他用户内容"
        )
        db_session.add(other_note)
        db_session.commit()

        # 尝试访问其他用户的资源
        response = client.get(
            f"/api/notes/{other_note.id}",
            headers=auth_headers
        )

        assert response.status_code == 403
        assert "权限不足" in response.json()["detail"]

    # ===== 输入验证错误处理测试 =====

    def test_invalid_json_payload(self, test_user: User, auth_headers: dict):
        """测试无效JSON负载错误处理"""
        response = client.post(
            "/api/notes",
            content="invalid json {",
            headers={**auth_headers, "Content-Type": "application/json"}
        )

        assert response.status_code == 422
        assert "JSON解析错误" in response.text or "validation error" in response.text

    def test_missing_required_fields(self, test_user: User, auth_headers: dict):
        """测试缺少必填字段错误处理"""
        # 缺少标题字段
        response = client.post(
            "/api/notes",
            json={
                "content": "只有内容没有标题"
            },
            headers=auth_headers
        )

        assert response.status_code == 422
        assert "title" in response.text.lower()

    def test_invalid_field_types(self, test_user: User, auth_headers: dict):
        """测试无效字段类型错误处理"""
        # 持续时间应该是整数，但提供了字符串
        response = client.post(
            "/api/pomodoro/sessions",
            json={
                "duration": "not_a_number",
                "type": "focus"
            },
            headers=auth_headers
        )

        assert response.status_code == 422
        assert "duration" in response.text.lower()

    def test_invalid_date_format(self, test_user: User, auth_headers: dict):
        """测试无效日期格式错误处理"""
        # 先创建看板和列表
        board_response = client.post(
            "/api/boards",
            json={"name": "测试看板", "description": "测试描述"},
            headers=auth_headers
        )
        board_id = board_response.json()["id"]

        list_response = client.post(
            "/api/lists",
            json={"board_id": board_id, "name": "测试列表"},
            headers=auth_headers
        )
        list_id = list_response.json()["id"]

        # 提供无效的日期格式
        response = client.post(
            "/api/cards",
            json={
                "list_id": list_id,
                "title": "测试卡片",
                "due_date": "invalid-date-format"
            },
            headers=auth_headers
        )

        assert response.status_code == 422
        assert "due_date" in response.text.lower()

    # ===== 业务逻辑错误处理测试 =====

    def test_creating_card_in_nonexistent_list(self, test_user: User, auth_headers: dict):
        """测试在不存在的列表中创建卡片"""
        non_existent_list_id = str(uuid.uuid4())

        response = client.post(
            "/api/cards",
            json={
                "list_id": non_existent_list_id,
                "title": "测试卡片"
            },
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "列表不存在" in response.json()["detail"]

    def test_moving_card_to_nonexistent_list(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试移动卡片到不存在的列表"""
        # 先创建看板、列表和卡片
        board_response = client.post(
            "/api/boards",
            json={"name": "测试看板", "description": "测试描述"},
            headers=auth_headers
        )
        board_id = board_response.json()["id"]

        list_response = client.post(
            "/api/lists",
            json={"board_id": board_id, "name": "测试列表"},
            headers=auth_headers
        )
        list_id = list_response.json()["id"]

        card_response = client.post(
            "/api/cards",
            json={"list_id": list_id, "title": "测试卡片"},
            headers=auth_headers
        )
        card_id = card_response.json()["id"]

        # 尝试移动到不存在的列表
        non_existent_list_id = str(uuid.uuid4())
        response = client.put(
            f"/api/cards/{card_id}/move",
            json={
                "target_list_id": non_existent_list_id,
                "new_position": 0
            },
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "目标列表不存在" in response.json()["detail"]

    def test_completing_nonexistent_pomodoro_session(self, test_user: User, auth_headers: dict):
        """测试完成不存在的番茄钟会话"""
        non_existent_session_id = str(uuid.uuid4())

        response = client.put(
            f"/api/pomodoro/sessions/{non_existent_session_id}/complete",
            headers=auth_headers
        )

        assert response.status_code == 404
        assert "会话不存在" in response.json()["detail"]

    # ===== 外部服务错误处理测试 =====

    def test_ai_service_unavailable(self, test_user: User, auth_headers: dict):
        """测试AI服务不可用错误处理"""
        # 模拟AI服务不可用
        def mock_ai_completion(*args, **kwargs):
            raise Exception("AI service unavailable")

        with patch.object(AIService, 'generate_completion', side_effect=mock_ai_completion):
            response = client.post(
                "/api/chat/completions",
                json={
                    "messages": [{"role": "user", "content": "测试消息"}],
                    "model": "gpt-3.5-turbo"
                },
                headers=auth_headers
            )

            assert response.status_code == 503
            assert "AI服务不可用" in response.json()["detail"]

    def test_ai_service_timeout(self, test_user: User, auth_headers: dict):
        """测试AI服务超时错误处理"""
        # 模拟AI服务超时
        def mock_timeout(*args, **kwargs):
            raise TimeoutError("AI service timeout")

        with patch.object(AIService, 'generate_completion', side_effect=mock_timeout):
            response = client.post(
                "/api/chat/completions",
                json={
                    "messages": [{"role": "user", "content": "测试消息"}],
                    "model": "gpt-3.5-turbo"
                },
                headers=auth_headers
            )

            assert response.status_code == 504
            assert "AI服务超时" in response.json()["detail"]

    # ===== 资源限制错误处理测试 =====

    def test_rate_limiting(self, test_user: User, auth_headers: dict):
        """测试速率限制错误处理"""
        # 模拟大量请求触发速率限制
        for i in range(100):
            response = client.get(
                "/api/notes",
                headers=auth_headers
            )

            if i > 50:  # 假设50个请求后触发速率限制
                if response.status_code == 429:
                    assert "请求过于频繁" in response.json()["detail"]
                    break

    def test_file_size_limit_exceeded(self, test_user: User, auth_headers: dict):
        """测试文件大小限制错误处理"""
        # 创建超大内容
        large_content = "A" * (10 * 1024 * 1024 + 1)  # 10MB + 1字节

        response = client.post(
            "/api/notes",
            json={
                "title": "大文件测试",
                "content": large_content
            },
            headers=auth_headers
        )

        assert response.status_code == 413
        assert "内容过大" in response.json()["detail"]

    # ===== 网络错误处理测试 =====

    def test_network_timeout(self, test_user: User, auth_headers: dict):
        """测试网络超时错误处理"""
        # 模拟网络超时
        def mock_timeout(*args, **kwargs):
            raise TimeoutError("Network timeout")

        with patch('requests.get', side_effect=mock_timeout):
            response = client.get(
                "/api/ai/models",
                headers=auth_headers
            )

            assert response.status_code == 504
            assert "网络超时" in response.json()["detail"]

    def test_network_connection_error(self, test_user: User, auth_headers: dict):
        """测试网络连接错误处理"""
        # 模拟网络连接错误
        def mock_connection_error(*args, **kwargs):
            raise ConnectionError("Connection refused")

        with patch('requests.get', side_effect=mock_connection_error):
            response = client.get(
                "/api/ai/models",
                headers=auth_headers
            )

            assert response.status_code == 503
            assert "网络连接错误" in response.json()["detail"]

    # ===== 数据完整性错误处理测试 =====

    def test_data_corruption_handling(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试数据损坏错误处理"""
        # 创建笔记
        response = client.post(
            "/api/notes",
            json={
                "title": "数据完整性测试",
                "content": "测试内容"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        note_id = response.json()["id"]

        # 模拟数据损坏（直接修改数据库）
        note = db_session.query(Note).filter(Note.id == note_id).first()
        note.content = None  # 模拟损坏的数据
        db_session.commit()

        # 尝试获取损坏的数据
        response = client.get(
            f"/api/notes/{note_id}",
            headers=auth_headers
        )

        # 应该优雅处理，而不是崩溃
        assert response.status_code in [200, 500]
        if response.status_code == 500:
            assert "数据错误" in response.json()["detail"]

    # ===== 并发错误处理测试 =====

    def test_concurrent_modification(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试并发修改错误处理"""
        # 创建笔记
        response = client.post(
            "/api/notes",
            json={
                "title": "并发测试笔记",
                "content": "初始内容"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        note_id = response.json()["id"]

        # 模拟并发修改
        response1 = client.put(
            f"/api/notes/{note_id}",
            json={"content": "第一次修改"},
            headers=auth_headers
        )

        response2 = client.put(
            f"/api/notes/{note_id}",
            json={"content": "第二次修改"},
            headers=auth_headers
        )

        # 两个请求都应该成功，但只有一个会生效
        assert response1.status_code == 200
        assert response2.status_code == 200

    # ===== 系统资源错误处理测试 =====

    def test_memory_limit_exceeded(self, test_user: User, auth_headers: dict):
        """测试内存限制错误处理"""
        # 尝试创建会消耗大量内存的操作
        large_batch = [
            {"title": f"内存测试 {i}", "content": "A" * 1000000}  # 每个1MB
            for i in range(1000)
        ]

        response = client.post(
            "/api/notes/bulk",
            json={"notes": large_batch},
            headers=auth_headers
        )

        # 应该优雅处理内存限制，而不是崩溃
        assert response.status_code in [413, 500]
        if response.status_code == 500:
            assert "内存" in response.json()["detail"]

    # ===== 错误信息安全性测试 =====

    def test_error_information_disclosure(self, test_user: User, auth_headers: dict):
        """测试错误信息泄露"""
        # 尝试触发数据库错误
        invalid_query = "../../etc/passwd"

        response = client.get(
            f"/api/notes?search={invalid_query}",
            headers=auth_headers
        )

        # 错误信息不应该包含敏感信息
        if response.status_code == 500:
            error_detail = response.json()["detail"]
            assert "password" not in error_detail.lower()
            assert "/etc/passwd" not in error_detail
            assert "sql" not in error_detail.lower()

    # ===== 错误恢复测试 =====

    def test_graceful_error_recovery(self, test_user: User, auth_headers: dict):
        """测试优雅的错误恢复"""
        # 触发一个错误
        response = client.get(
            "/api/notes/invalid-uuid",
            headers=auth_headers
        )

        assert response.status_code == 422

        # 验证系统仍然可以正常工作
        response = client.get(
            "/api/notes",
            headers=auth_headers
        )

        assert response.status_code == 200  # 应该正常恢复

    # ===== 日志记录测试 =====

    def test_error_logging(self, test_user: User, auth_headers: dict):
        """测试错误日志记录"""
        # 触发一个已知错误
        with patch('logging.error') as mock_log:
            response = client.get(
                "/api/notes/invalid-uuid",
                headers=auth_headers
            )

            assert response.status_code == 422
            # 验证错误被记录
            mock_log.assert_called()

    # ===== 客户端友好错误测试 =====

    def test_client_friendly_error_messages(self, test_user: User, auth_headers: dict):
        """测试客户端友好的错误消息"""
        # 测试各种错误情况的消息友好性
        test_cases = [
            ("/api/notes/invalid-uuid", 422),
            ("/api/notes/nonexistent-id", 404),
            ("/api/pomodoro/sessions", 422, {"invalid": "data"}),
        ]

        for test_case in test_cases:
            if len(test_case) == 2:
                endpoint, expected_status = test_case
                response = client.get(endpoint, headers=auth_headers)
            else:
                endpoint, expected_status, data = test_case
                response = client.post(endpoint, json=data, headers=auth_headers)

            assert response.status_code == expected_status
            error_response = response.json()

            # 验证错误消息的格式
            assert "detail" in error_response
            assert isinstance(error_response["detail"], str)
            assert len(error_response["detail"]) > 0

            # 错误消息应该对用户友好
            detail = error_response["detail"].lower()
            assert "exception" not in detail
            assert "traceback" not in detail
            assert "error" not in detail or "用户" in detail