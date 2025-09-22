#
# Pomodoro服务层测试
#

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from services.pomodoro_service import PomodoroService, get_pomodoro_service
from models.pomodoro import PomodoroSession, PomodoroSettings, SessionType, SessionStatus
from models.user import User


class TestPomodoroService:
    """测试Pomodoro服务层"""

    def test_create_session_success(self, db_session: Session, create_test_user):
        """测试成功创建会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25,
            completed_pomodoros_count=0,
            notes="开始工作"
        )

        assert session is not None
        assert session.user_id == user.id
        assert session.session_type == SessionType.WORK
        assert session.status == SessionStatus.ACTIVE
        assert session.planned_duration == 25
        assert session.notes == "开始工作"

    def test_create_session_with_existing_active_session(self, db_session: Session, create_test_user):
        """测试当已存在活跃会话时创建新会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 创建第一个会话
        service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        # 尝试创建第二个会话应该失败
        with pytest.raises(ValueError, match="已存在活跃的番茄钟会话"):
            service.create_session(
                user_id=user.id,
                session_type=SessionType.WORK,
                planned_duration=25
            )

    def test_get_active_session_exists(self, db_session: Session, create_test_user):
        """测试获取存在的活跃会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 创建活跃会话
        created_session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        # 获取活跃会话
        active_session = service.get_active_session(user.id)

        assert active_session is not None
        assert active_session.id == created_session.id
        assert active_session.status == SessionStatus.ACTIVE

    def test_get_active_session_not_exists(self, db_session: Session, create_test_user):
        """测试当没有活跃会话时"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        active_session = service.get_active_session(user.id)
        assert active_session is None

    def test_get_session_exists(self, db_session: Session, create_test_user):
        """测试获取存在的会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        created_session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        session = service.get_session(created_session.id, user.id)
        assert session is not None
        assert session.id == created_session.id

    def test_get_session_not_exists(self, db_session: Session, create_test_user):
        """测试获取不存在的会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.get_session("nonexistent-id", user.id)
        assert session is None

    def test_pause_session_success(self, db_session: Session, create_test_user):
        """测试成功暂停会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        paused_session = service.pause_session(session.id, user.id)

        assert paused_session.status == SessionStatus.PAUSED
        assert paused_session.paused_at is not None

    def test_pause_session_not_active(self, db_session: Session, create_test_user):
        """测试暂停非活跃会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        # 先暂停会话
        service.pause_session(session.id, user.id)

        # 再次尝试暂停应该失败
        with pytest.raises(ValueError, match="会话不在活跃状态"):
            service.pause_session(session.id, user.id)

    def test_resume_session_success(self, db_session: Session, create_test_user):
        """测试成功恢复会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        # 先暂停
        service.pause_session(session.id, user.id)

        # 再恢复
        resumed_session = service.resume_session(session.id, user.id)

        assert resumed_session.status == SessionStatus.ACTIVE
        assert resumed_session.paused_at is None
        assert resumed_session.total_pause_duration > 0

    def test_resume_session_not_paused(self, db_session: Session, create_test_user):
        """测试恢复非暂停会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        # 直接尝试恢复活跃会话应该失败
        with pytest.raises(ValueError, match="会话不在暂停状态"):
            service.resume_session(session.id, user.id)

    def test_complete_session_success(self, db_session: Session, create_test_user):
        """测试成功完成会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        completed_session = service.complete_session(session.id, user.id)

        assert completed_session.status == SessionStatus.COMPLETED
        assert completed_session.end_time is not None
        assert completed_session.actual_duration is not None

    def test_complete_session_not_active(self, db_session: Session, create_test_user):
        """测试完成非活跃会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        # 先完成会话
        service.complete_session(session.id, user.id)

        # 再次尝试完成应该失败
        with pytest.raises(ValueError, match="会话状态无效"):
            service.complete_session(session.id, user.id)

    def test_abandon_session_success(self, db_session: Session, create_test_user):
        """测试成功放弃会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )

        abandoned_session = service.abandon_session(session.id, user.id)

        assert abandoned_session.status == SessionStatus.ABANDONED
        assert abandoned_session.end_time is not None

    def test_get_session_history(self, db_session: Session, create_test_user):
        """测试获取会话历史"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 创建多个会话
        sessions = []
        for i in range(5):
            session = service.create_session(
                user_id=user.id,
                session_type=SessionType.WORK,
                planned_duration=25
            )
            # 完成会话以便出现在历史中
            service.complete_session(session.id, user.id)
            sessions.append(session)

        # 获取历史
        history = service.get_session_history(user.id, limit=3)

        assert len(history) == 3
        # 应该按创建时间倒序排列
        assert history[0].created_at >= history[1].created_at

    def test_get_or_create_settings_exists(self, db_session: Session, create_test_user):
        """测试获取已存在的设置"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 先创建设置
        original_settings = PomodoroSettings(user_id=user.id, work_duration=30)
        db_session.add(original_settings)
        db_session.commit()

        # 获取设置
        settings = service.get_or_create_settings(user.id)

        assert settings.user_id == user.id
        assert settings.work_duration == 30

    def test_get_or_create_settings_not_exists(self, db_session: Session, create_test_user):
        """测试获取不存在的设置（自动创建）"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        settings = service.get_or_create_settings(user.id)

        assert settings is not None
        assert settings.user_id == user.id
        assert settings.work_duration == 25  # 默认值

    def test_update_settings_success(self, db_session: Session, create_test_user):
        """测试成功更新设置"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 获取或创建设置
        original_settings = service.get_or_create_settings(user.id)

        # 更新设置
        updated_settings = service.update_settings(
            user.id,
            work_duration=30,
            short_break_duration=10,
            auto_start_break=False
        )

        assert updated_settings.work_duration == 30
        assert updated_settings.short_break_duration == 10
        assert updated_settings.auto_start_break is False

    def test_update_settings_invalid_field(self, db_session: Session, create_test_user):
        """测试更新无效字段"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 获取或创建设置
        service.get_or_create_settings(user.id)

        # 更新设置（包含无效字段）
        updated_settings = service.update_settings(
            user.id,
            work_duration=30,
            invalid_field="should_be_ignored"
        )

        assert updated_settings.work_duration == 30
        # 无效字段应该被忽略，不会抛出异常

    def test_get_statistics_daily(self, db_session: Session, create_test_user):
        """测试获取每日统计"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 创建一些会话
        for i in range(3):
            session = service.create_session(
                user_id=user.id,
                session_type=SessionType.WORK,
                planned_duration=25
            )
            service.complete_session(session.id, user.id)

        stats = service.get_statistics(user.id, 'daily')

        assert stats['period'] == 'daily'
        assert stats['total_sessions'] == 3
        assert stats['work_sessions'] == 3
        assert stats['completion_rate'] == 100.0

    def test_get_statistics_weekly(self, db_session: Session, create_test_user):
        """测试获取每周统计"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        stats = service.get_statistics(user.id, 'weekly')

        assert stats['period'] == 'weekly'
        assert 'total_sessions' in stats
        assert 'completion_rate' in stats

    def test_get_statistics_monthly(self, db_session: Session, create_test_user):
        """测试获取每月统计"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        stats = service.get_statistics(user.id, 'monthly')

        assert stats['period'] == 'monthly'
        assert 'total_sessions' in stats
        assert 'completion_rate' in stats

    def test_get_statistics_invalid_period(self, db_session: Session, create_test_user):
        """测试获取无效周期的统计"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        with pytest.raises(ValueError, match="无效的统计周期"):
            service.get_statistics(user.id, 'invalid')

    def test_get_next_recommended_session_first_time(self, db_session: Session, create_test_user):
        """测试首次推荐会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        recommendation = service.get_next_recommended_session(user.id)

        assert recommendation['session_type'] == 'work'  # 第一次应该是工作
        assert recommendation['recommended_duration'] == 25  # 默认工作时长
        assert recommendation['completed_work_sessions_today'] == 0

    def test_get_next_recommended_session_after_work(self, db_session: Session, create_test_user):
        """测试工作后的推荐会话"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 先完成一个工作会话
        work_session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )
        service.complete_session(work_session.id, user.id)

        recommendation = service.get_next_recommended_session(user.id)

        assert recommendation['session_type'] == 'short_break'  # 工作后应该是短休息
        assert recommendation['recommended_duration'] == 5  # 默认短休息时长
        assert recommendation['completed_work_sessions_today'] == 1

    def test_get_next_recommended_session_after_4_work(self, db_session: Session, create_test_user):
        """测试4个工作后的推荐会话（应该是长休息）"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 完成4个工作会话
        for i in range(4):
            work_session = service.create_session(
                user_id=user.id,
                session_type=SessionType.WORK,
                planned_duration=25
            )
            service.complete_session(work_session.id, user.id)

        recommendation = service.get_next_recommended_session(user.id)

        assert recommendation['session_type'] == 'long_break'  # 4个工作后应该是长休息
        assert recommendation['recommended_duration'] == 15  # 默认长休息时长
        assert recommendation['completed_work_sessions_today'] == 4

    def test_get_pomodoro_service_factory(self, db_session: Session):
        """测试服务工厂函数"""
        service = get_pomodoro_service(db_session)
        assert isinstance(service, PomodoroService)
        assert service.db == db_session

    def test_session_operations_invalid_session(self, db_session: Session, create_test_user):
        """测试对不存在会话的操作"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 测试各种操作对不存在会话的情况
        with pytest.raises(ValueError, match="会话不存在"):
            service.pause_session("nonexistent", user.id)

        with pytest.raises(ValueError, match="会话不存在"):
            service.resume_session("nonexistent", user.id)

        with pytest.raises(ValueError, match="会话不存在"):
            service.complete_session("nonexistent", user.id)

        with pytest.raises(ValueError, match="会话不存在"):
            service.abandon_session("nonexistent", user.id)

    def test_mixed_session_types_in_statistics(self, db_session: Session, create_test_user):
        """测试混合会话类型的统计"""
        user = create_test_user(db_session)
        service = PomodoroService(db_session)

        # 创建工作会话
        work_session = service.create_session(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )
        # 手动设置实际时长来模拟真实场景
        work_session.actual_duration = 25
        work_session.status = SessionStatus.COMPLETED
        db_session.commit()

        # 创建短休息会话
        break_session = service.create_session(
            user_id=user.id,
            session_type=SessionType.SHORT_BREAK,
            planned_duration=5
        )
        # 手动设置实际时长来模拟真实场景
        break_session.actual_duration = 5
        break_session.status = SessionStatus.COMPLETED
        db_session.commit()

        stats = service.get_statistics(user.id, 'daily')

        assert stats['total_sessions'] == 2
        assert stats['work_sessions'] == 1
        assert stats['break_sessions'] == 1
        assert stats['total_work_time'] == 25
        assert stats['total_break_time'] == 5


if __name__ == "__main__":
    pytest.main([__file__])