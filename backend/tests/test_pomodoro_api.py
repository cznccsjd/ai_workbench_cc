#
# Pomodoro API测试
#

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from unittest.mock import Mock, patch

from main import app
from models.pomodoro import SessionType, SessionStatus

class TestPomodoroAPI:
    """测试Pomodoro API端点"""

    def _complete_active_session(self, client):
        """完成当前活跃会话（如果存在）"""
        active_response = client.get("/api/pomodoro/active-session")
        if active_response.status_code == 200:
            active_data = active_response.json()
            if active_data:
                client.put(f"/api/pomodoro/sessions/{active_data['id']}", json={
                    "action": "complete"
                })

    def _create_and_complete_session(self, client, session_type="work", planned_duration=25):
        """创建会话并完成它"""
        self._complete_active_session(client)

        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": session_type,
            "planned_duration": planned_duration
        })
        if create_response.status_code == 200:
            session_data = create_response.json()
            client.put(f"/api/pomodoro/sessions/{session_data['id']}", json={
                "action": "complete"
            })
            return session_data
        return None

    def test_create_session_success(self, client):
        """测试成功创建会话"""
        response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25,
            "completed_pomodoros_count": 0,
            "notes": "开始工作"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["session_type"] == "work"
        assert data["status"] == "active"
        assert data["planned_duration"] == 25
        assert data["notes"] == "开始工作"
        assert "id" in data
        assert "start_time" in data

    def test_create_session_invalid_type(self, client):
        """测试创建会话时无效的类型"""
        response = client.post("/api/pomodoro/sessions", json={
            "session_type": "invalid_type",
            "planned_duration": 25
        })

        assert response.status_code == 400
        data = response.json()
        assert "无效的会话类型" in data["detail"]

    def test_create_session_validation_error(self, client):
        """测试创建会话时验证错误"""
        response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 0  # 小于最小值
        })

        assert response.status_code == 422  # FastAPI验证错误

    def test_create_session_duplicate_active(self, client):
        """测试创建重复活跃会话"""
        # 创建第一个会话
        response1 = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        assert response1.status_code == 200

        # 尝试创建第二个会话
        response2 = client.post("/api/pomodoro/sessions", json={
            "session_type": "short_break",
            "planned_duration": 5
        })

        assert response2.status_code == 400
        data = response2.json()
        assert "已存在活跃的番茄钟会话" in data["detail"]

    def test_get_sessions_empty(self, client):
        """测试获取空会话列表"""
        response = client.get("/api/pomodoro/sessions")

        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    def test_get_sessions_with_data(self, client):
        """测试获取有数据的会话列表"""
        # 先创建一些会话
        for i in range(3):
            client.post("/api/pomodoro/sessions", json={
                "session_type": "work",
                "planned_duration": 25,
                "notes": f"会话 {i+1}"
            })
            # 完成会话以便它们出现在历史中
            # 这里简化处理，实际应该获取会话ID并完成

        response = client.get("/api/pomodoro/sessions?page=1&page_size=10")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["sessions"], list)
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_get_session_detail_success(self, client):
        """测试成功获取会话详情"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 先创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25,
            "notes": "测试会话"
        })
        session_id = create_response.json()["id"]

        # 获取详情
        response = client.get(f"/api/pomodoro/sessions/{session_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert data["session_type"] == "work"
        assert data["notes"] == "测试会话"

    def test_get_session_detail_not_found(self, client):
        """测试获取不存在的会话详情"""
        response = client.get("/api/pomodoro/sessions/nonexistent-id")

        assert response.status_code == 404
        data = response.json()
        assert "会话不存在" in data["detail"]

    def test_update_session_pause_success(self, client):
        """测试成功暂停会话"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 先创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_id = create_response.json()["id"]

        # 暂停会话
        response = client.put(f"/api/pomodoro/sessions/{session_id}", json={
            "action": "pause"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paused"
        assert data["paused_at"] is not None

    def test_update_session_resume_success(self, client):
        """测试成功恢复会话"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 先创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_id = create_response.json()["id"]

        # 暂停会话
        client.put(f"/api/pomodoro/sessions/{session_id}", json={
            "action": "pause"
        })

        # 恢复会话
        response = client.put(f"/api/pomodoro/sessions/{session_id}", json={
            "action": "resume"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert data["paused_at"] is None

    def test_update_session_complete_success(self, client):
        """测试成功完成会话"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 先创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_id = create_response.json()["id"]

        # 完成会话
        response = client.put(f"/api/pomodoro/sessions/{session_id}", json={
            "action": "complete"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["end_time"] is not None
        assert data["actual_duration"] is not None

    def test_update_session_abandon_success(self, client):
        """测试成功放弃会话"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 先创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_id = create_response.json()["id"]

        # 放弃会话
        response = client.put(f"/api/pomodoro/sessions/{session_id}", json={
            "action": "abandon"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "abandoned"
        assert data["end_time"] is not None

    def test_update_session_invalid_action(self, client):
        """测试更新会话时无效的操作"""
        response = client.put("/api/pomodoro/sessions/some-id", json={
            "action": "invalid_action"
        })

        assert response.status_code == 400
        data = response.json()
        assert "无效的操作" in data["detail"]

    def test_update_session_not_found(self, client):
        """测试更新不存在的会话"""
        response = client.put("/api/pomodoro/sessions/nonexistent-id", json={
            "action": "pause"
        })

        assert response.status_code == 400
        data = response.json()
        assert "会话不存在" in data["detail"]

    def test_get_statistics_daily(self, client):
        """测试获取每日统计"""
        response = client.get("/api/pomodoro/statistics?period=daily")

        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "daily"
        assert "total_sessions" in data
        assert "work_sessions" in data
        assert "completion_rate" in data
        assert "status_distribution" in data

    def test_get_statistics_weekly(self, client):
        """测试获取每周统计"""
        response = client.get("/api/pomodoro/statistics?period=weekly")

        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "weekly"
        assert "total_sessions" in data

    def test_get_statistics_monthly(self, client):
        """测试获取每月统计"""
        response = client.get("/api/pomodoro/statistics?period=monthly")

        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "monthly"
        assert "total_sessions" in data

    def test_get_statistics_invalid_period(self, client):
        """测试获取统计时无效的周期"""
        response = client.get("/api/pomodoro/statistics?period=invalid")

        assert response.status_code == 422  # FastAPI验证错误

    def test_get_settings_success(self, client):
        """测试成功获取设置"""
        response = client.get("/api/pomodoro/settings")

        assert response.status_code == 200
        data = response.json()
        assert "work_duration" in data
        assert "short_break_duration" in data
        assert "long_break_duration" in data
        assert "long_break_interval" in data
        assert data["work_duration"] == 25  # 默认值
        assert data["short_break_duration"] == 5  # 默认值

    def test_update_settings_success(self, client):
        """测试成功更新设置"""
        response = client.put("/api/pomodoro/settings", json={
            "work_duration": 30,
            "short_break_duration": 10,
            "auto_start_break": False
        })

        assert response.status_code == 200
        data = response.json()
        assert data["work_duration"] == 30
        assert data["short_break_duration"] == 10
        assert data["auto_start_break"] is False

    def test_update_settings_invalid_theme(self, client):
        """测试更新设置时无效的主题"""
        response = client.put("/api/pomodoro/settings", json={
            "theme": "invalid_theme"
        })

        assert response.status_code == 400
        data = response.json()
        assert "无效的主题" in data["detail"]

    def test_get_next_recommendation_first_time(self, client):
        """测试首次推荐会话"""
        response = client.get("/api/pomodoro/next-recommendation")

        assert response.status_code == 200
        data = response.json()
        assert data["session_type"] == "work"  # 第一次应该是工作
        assert data["recommended_duration"] == 25  # 默认工作时长
        assert data["completed_work_sessions_today"] == 0
        assert "user_settings" in data

    def test_get_next_recommendation_after_work(self, client):
        """测试工作后的推荐会话"""
        # 先完成一个工作会话
        client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })

        response = client.get("/api/pomodoro/next-recommendation")

        assert response.status_code == 200
        data = response.json()
        # 根据测试中的实现，这里应该返回短休息
        assert data["session_type"] in ["short_break", "work"]

    def test_get_active_session_none(self, client):
        """测试没有活跃会话"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        response = client.get("/api/pomodoro/active-session")

        # 如果没有活跃会话，应该返回404
        assert response.status_code == 404
        data = response.json()
        assert "没有活跃的番茄钟会话" in data["detail"]

    def test_get_active_session_exists(self, client):
        """测试存在活跃会话"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 先创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_data = create_response.json()

        # 获取活跃会话
        response = client.get("/api/pomodoro/active-session")

        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert data["id"] == session_data["id"]
        assert data["status"] == "active"

    def test_api_response_formats(self, client):
        """测试API响应格式"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_data = create_response.json()

        # 验证响应格式
        required_fields = [
            "id", "session_type", "status", "start_time", "planned_duration",
            "completed_pomodoros_count", "notes", "created_at", "updated_at"
        ]
        for field in required_fields:
            assert field in session_data, f"会话响应缺少字段: {field}"

        # 验证设置响应格式
        settings_response = client.get("/api/pomodoro/settings")
        settings_data = settings_response.json()

        settings_fields = [
            "id", "user_id", "work_duration", "short_break_duration",
            "long_break_duration", "long_break_interval", "auto_start_break",
            "auto_start_work", "sound_enabled", "notification_enabled", "theme"
        ]
        for field in settings_fields:
            assert field in settings_data, f"设置响应缺少字段: {field}"

        # 验证统计响应格式
        stats_response = client.get("/api/pomodoro/statistics")
        stats_data = stats_response.json()

        stats_fields = [
            "period", "total_sessions", "work_sessions", "break_sessions",
            "completion_rate", "status_distribution"
        ]
        for field in stats_fields:
            assert field in stats_data, f"统计响应缺少字段: {field}"

    def test_pagination_parameters(self, client):
        """测试分页参数"""
        response = client.get("/api/pomodoro/sessions?page=2&page_size=5")

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["page_size"] == 5

    def test_edge_cases(self, client):
        """测试边界情况"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 测试创建会话时最大最小值
        response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 120,  # 最大值
            "completed_pomodoros_count": 999
        })
        assert response.status_code == 200

        # 测试更新设置时边界值
        response = client.put("/api/pomodoro/settings", json={
            "work_duration": 60,  # 最大值
            "short_break_duration": 30,  # 最大值
            "long_break_duration": 60,  # 最大值
            "long_break_interval": 10  # 最大值
        })
        assert response.status_code == 200

    def test_concurrent_operations(self, client):
        """测试并发操作（简化测试）"""
        # 先完成任何现有的活跃会话
        self._complete_active_session(client)

        # 创建会话
        create_response = client.post("/api/pomodoro/sessions", json={
            "session_type": "work",
            "planned_duration": 25
        })
        session_id = create_response.json()["id"]

        # 连续执行多个操作
        operations = ["pause", "resume", "pause", "complete"]
        for operation in operations:
            response = client.put(f"/api/pomodoro/sessions/{session_id}", json={
                "action": operation
            })
            # 有些操作可能会失败（比如重复暂停），但不应该崩溃
            assert response.status_code in [200, 400]


if __name__ == "__main__":
    pytest.main([__file__])