"""
性能测试套件
测试系统的性能基准和负载能力
"""

import pytest
import time
import concurrent.futures
import psutil
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from main import app
from database.session import get_db
from models.user import User
from models.pomodoro import PomodoroSession
from models.kanban import Board, List, Card
from models.note import Note
from fastapi.testclient import TestClient

client = TestClient(app)


class TestPerformance:
    """性能测试类"""

    @pytest.fixture
    def test_user(self, db_session: Session):
        """创建测试用户"""
        user = User(
            id=str(uuid.uuid4()),
            username="test_performance_user",
            email="performance@test.com",
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

    def measure_time(self, func, *args, **kwargs):
        """测量函数执行时间"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        return result, end_time - start_time

    def measure_memory(self):
        """测量内存使用"""
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # MB

    # ===== 数据库操作性能测试 =====

    @pytest.mark.performance
    def test_note_creation_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试笔记创建性能"""
        # 创建大量笔记测试性能
        notes_data = [
            {
                "title": f"性能测试笔记 {i}",
                "content": f"这是性能测试的内容 {i}\n" * 100  # 1KB左右的内容
            }
            for i in range(1000)
        ]

        start_time = time.time()
        start_memory = self.measure_memory()

        for note_data in notes_data:
            response = client.post(
                "/api/notes",
                json=note_data,
                headers=auth_headers
            )
            assert response.status_code == 200

        end_time = time.time()
        end_memory = self.measure_memory()

        execution_time = end_time - start_time
        memory_usage = end_memory - start_memory

        # 性能基准：1000个笔记应该在30秒内完成
        assert execution_time < 30, f"创建1000个笔记耗时过长: {execution_time}秒"
        # 内存使用增量应该小于100MB
        assert memory_usage < 100, f"内存使用过高: {memory_usage}MB"

    @pytest.mark.performance
    def test_note_query_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试笔记查询性能"""
        # 先创建测试数据
        for i in range(500):
            note = Note(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                title=f"查询测试笔记 {i}",
                content=f"查询测试内容 {i}\n" * 50
            )
            db_session.add(note)
        db_session.commit()

        # 测试不同查询的性能
        queries = [
            "",
            "测试",
            "查询测试笔记",
            "不存在的搜索词"
        ]

        for query in queries:
            start_time = time.time()
            response = client.get(
                f"/api/notes?search={query}",
                headers=auth_headers
            )
            end_time = time.time()

            assert response.status_code == 200
            execution_time = end_time - start_time

            # 查询应该在1秒内完成
            assert execution_time < 1, f"查询耗时过长: {execution_time}秒"

    @pytest.mark.performance
    def test_kanban_operations_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试看板操作性能"""
        # 创建看板
        start_time = time.time()

        board_response = client.post(
            "/api/boards",
            json={
                "name": "性能测试看板",
                "description": "性能测试描述"
            },
            headers=auth_headers
        )
        assert board_response.status_code == 200
        board_id = board_response.json()["id"]

        # 创建多个列表
        list_ids = []
        for i in range(10):
            list_response = client.post(
                "/api/lists",
                json={
                    "board_id": board_id,
                    "name": f"列表 {i}"
                },
                headers=auth_headers
            )
            assert list_response.status_code == 200
            list_ids.append(list_response.json()["id"])

        # 在每个列表中创建多个卡片
        for list_id in list_ids:
            for i in range(20):
                card_response = client.post(
                    "/api/cards",
                    json={
                        "list_id": list_id,
                        "title": f"卡片 {i}",
                        "description": f"卡片描述 {i}"
                    },
                    headers=auth_headers
                )
                assert card_response.status_code == 200

        end_time = time.time()
        execution_time = end_time - start_time

        # 创建1个看板、10个列表、200个卡片应该在10秒内完成
        assert execution_time < 10, f"看板操作耗时过长: {execution_time}秒"

    @pytest.mark.performance
    def test_pomodoro_session_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试番茄钟会话性能"""
        # 创建大量番茄钟会话
        sessions_data = [
            {
                "duration": 1500,
                "type": "focus" if i % 2 == 0 else "break"
            }
            for i in range(1000)
        ]

        start_time = time.time()
        start_memory = self.measure_memory()

        for session_data in sessions_data:
            response = client.post(
                "/api/pomodoro/sessions",
                json=session_data,
                headers=auth_headers
            )
            assert response.status_code == 200

        end_time = time.time()
        end_memory = self.measure_memory()

        execution_time = end_time - start_time
        memory_usage = end_memory - start_memory

        # 性能基准：1000个会话应该在20秒内完成
        assert execution_time < 20, f"创建1000个会话耗时过长: {execution_time}秒"
        assert memory_usage < 50, f"内存使用过高: {memory_usage}MB"

    # ===== 并发性能测试 =====

    @pytest.mark.performance
    def test_concurrent_note_operations(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试并发笔记操作"""
        def create_note(i):
            return client.post(
                "/api/notes",
                json={
                    "title": f"并发笔记 {i}",
                    "content": f"并发内容 {i}"
                },
                headers=auth_headers
            )

        def get_notes():
            return client.get(
                "/api/notes",
                headers=auth_headers
            )

        start_time = time.time()

        # 并发创建笔记
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_note, i) for i in range(100)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        # 验证所有请求都成功
        for result in results:
            assert result.status_code == 200

        end_time = time.time()
        execution_time = end_time - start_time

        # 100个并发请求应该在5秒内完成
        assert execution_time < 5, f"并发操作耗时过长: {execution_time}秒"

    @pytest.mark.performance
    def test_concurrent_pomodoro_operations(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试并发番茄钟操作"""
        def create_session(i):
            return client.post(
                "/api/pomodoro/sessions",
                json={
                    "duration": 1500,
                    "type": "focus"
                },
                headers=auth_headers
            )

        start_time = time.time()

        # 并发创建会话
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_session, i) for i in range(50)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        # 验证所有请求都成功
        for result in results:
            assert result.status_code == 200

        end_time = time.time()
        execution_time = end_time - start_time

        # 50个并发请求应该在3秒内完成
        assert execution_time < 3, f"并发番茄钟操作耗时过长: {execution_time}秒"

    # ===== 数据库查询性能测试 =====

    @pytest.mark.performance
    def test_complex_query_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试复杂查询性能"""
        # 创建大量测试数据
        for i in range(1000):
            note = Note(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                title=f"复杂查询测试笔记 {i}",
                content=f"内容包含搜索词 {i % 10}",
                is_bookmarked=i % 2 == 0,
                created_at=datetime.utcnow() - timedelta(days=i % 365)
            )
            db_session.add(note)
        db_session.commit()

        # 测试复杂查询
        complex_queries = [
            "/api/notes?search=搜索词&is_bookmarked=true&limit=50",
            "/api/notes?search=测试&sort=created_at&order=desc",
            "/api/notes?limit=100&offset=500"
        ]

        for query in complex_queries:
            start_time = time.time()
            response = client.get(query, headers=auth_headers)
            end_time = time.time()

            assert response.status_code == 200
            execution_time = end_time - start_time

            # 复杂查询应该在2秒内完成
            assert execution_time < 2, f"复杂查询耗时过长: {execution_time}秒"

    # ===== 内存使用测试 =====

    @pytest.mark.performance
    def test_memory_usage_stability(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试内存使用稳定性"""
        initial_memory = self.measure_memory()
        memory_samples = []

        # 执行多次操作并测量内存
        for i in range(100):
            # 创建笔记
            response = client.post(
                "/api/notes",
                json={
                    "title": f"内存测试笔记 {i}",
                    "content": f"内存测试内容 {i}\n" * 100
                },
                headers=auth_headers
            )
            assert response.status_code == 200

            # 查询笔记
            response = client.get(
                "/api/notes",
                headers=auth_headers
            )
            assert response.status_code == 200

            # 测量内存
            current_memory = self.measure_memory()
            memory_samples.append(current_memory)

        final_memory = self.measure_memory()
        memory_increase = final_memory - initial_memory

        # 内存增长应该小于50MB
        assert memory_increase < 50, f"内存增长过大: {memory_increase}MB"

        # 内存使用应该相对稳定（没有异常峰值）
        memory_variance = max(memory_samples) - min(memory_samples)
        assert memory_variance < 20, f"内存使用不稳定: {memory_variance}MB"

    # ===== 响应时间测试 =====

    @pytest.mark.performance
    def test_api_response_times(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试API响应时间"""
        endpoints = [
            ("GET", "/api/notes"),
            ("POST", "/api/notes", {"title": "测试", "content": "内容"}),
            ("GET", "/api/pomodoro/sessions"),
            ("POST", "/api/pomodoro/sessions", {"duration": 1500, "type": "focus"}),
            ("GET", "/api/boards"),
            ("GET", "/api/ai/models"),
        ]

        for method, endpoint, *data in endpoints:
            start_time = time.time()

            if method == "GET":
                response = client.get(endpoint, headers=auth_headers)
            elif method == "POST":
                response = client.post(endpoint, json=data[0], headers=auth_headers)

            end_time = time.time()
            execution_time = end_time - start_time

            assert response.status_code == 200
            # API响应应该在500毫秒内
            assert execution_time < 0.5, f"{method} {endpoint} 响应时间过长: {execution_time}秒"

    # ===== 批量操作性能测试 =====

    @pytest.mark.performance
    def test_bulk_operations_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试批量操作性能"""
        # 先创建一些测试数据
        note_ids = []
        for i in range(100):
            response = client.post(
                "/api/notes",
                json={
                    "title": f"批量测试笔记 {i}",
                    "content": f"批量测试内容 {i}"
                },
                headers=auth_headers
            )
            assert response.status_code == 200
            note_ids.append(response.json()["id"])

        # 测试批量删除性能
        start_time = time.time()
        response = client.delete(
            "/api/notes/bulk",
            json={"note_ids": note_ids},
            headers=auth_headers
        )
        end_time = time.time()

        assert response.status_code == 200
        execution_time = end_time - start_time

        # 批量删除100个笔记应该在2秒内完成
        assert execution_time < 2, f"批量删除耗时过长: {execution_time}秒"

    # ===== 数据库连接池测试 =====

    @pytest.mark.performance
    def test_database_connection_pool(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试数据库连接池性能"""
        def query_database(i):
            return client.get(
                "/api/notes",
                headers=auth_headers
            )

        start_time = time.time()

        # 创建大量并发数据库查询
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(query_database, i) for i in range(100)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        end_time = time.time()
        execution_time = end_time - start_time

        # 验证所有查询都成功
        for result in results:
            assert result.status_code == 200

        # 100个并发查询应该在10秒内完成
        assert execution_time < 10, f"数据库连接池测试耗时过长: {execution_time}秒"

    # ===== 缓存性能测试 =====

    @pytest.mark.performance
    def test_caching_performance(self, db_session: Session, test_user: User, auth_headers: dict):
        """测试缓存性能"""
        # 创建测试数据
        for i in range(100):
            note = Note(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                title=f"缓存测试笔记 {i}",
                content=f"缓存测试内容 {i}"
            )
            db_session.add(note)
        db_session.commit()

        # 第一次查询（应该较慢）
        start_time = time.time()
        response1 = client.get("/api/notes", headers=auth_headers)
        first_query_time = time.time() - start_time

        assert response1.status_code == 200

        # 第二次查询（应该更快，因为有缓存）
        start_time = time.time()
        response2 = client.get("/api/notes", headers=auth_headers)
        second_query_time = time.time() - start_time

        assert response2.status_code == 200

        # 第二次查询应该比第一次快（如果启用了缓存）
        # 这里给一个宽松的基准，第二次查询不超过第一次的80%
        assert second_query_time <= first_query_time * 0.8, \
            f"缓存未生效: 第一次{first_query_time}秒, 第二次{second_query_time}秒"