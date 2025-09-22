#
# Pomodoro数据库模型测试
#

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.pomodoro import PomodoroSession, PomodoroSettings, SessionType, SessionStatus
from models.user import User


class TestPomodoroModels:
    """测试Pomodoro数据库模型"""

    def test_create_pomodoro_session(self, db_session: Session, create_test_user):
        """测试创建番茄钟会话"""
        user = create_test_user(db_session)

        session = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.WORK,
            status=SessionStatus.ACTIVE,
            planned_duration=25,
            completed_pomodoros_count=0,
            notes="开始工作会话"
        )

        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)

        assert session.id is not None
        assert session.user_id == user.id
        assert session.session_type == SessionType.WORK
        assert session.status == SessionStatus.ACTIVE
        assert session.planned_duration == 25
        assert session.completed_pomodoros_count == 0
        assert session.notes == "开始工作会话"
        assert session.start_time is not None
        assert session.created_at is not None
        assert session.updated_at is not None

    def test_pomodoro_session_pause_resume(self, db_session: Session, create_test_user):
        """测试会话暂停和恢复"""
        user = create_test_user(db_session)

        session = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.WORK,
            status=SessionStatus.ACTIVE,
            planned_duration=25
        )
        db_session.add(session)
        db_session.commit()

        # 暂停会话
        session.pause()
        db_session.commit()

        assert session.status == SessionStatus.PAUSED
        assert session.paused_at is not None

        # 恢复会话
        session.resume()
        db_session.commit()

        assert session.status == SessionStatus.ACTIVE
        assert session.paused_at is None
        assert session.total_pause_duration > 0

    def test_pomodoro_session_complete(self, db_session: Session, create_test_user):
        """测试会话完成"""
        user = create_test_user(db_session)

        session = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.WORK,
            status=SessionStatus.ACTIVE,
            planned_duration=25
        )
        db_session.add(session)
        db_session.commit()

        # 完成会话
        session.complete()
        db_session.commit()

        assert session.status == SessionStatus.COMPLETED
        assert session.end_time is not None
        assert session.actual_duration is not None

    def test_pomodoro_session_abandon(self, db_session: Session, create_test_user):
        """测试会话放弃"""
        user = create_test_user(db_session)

        session = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.WORK,
            status=SessionStatus.ACTIVE,
            planned_duration=25
        )
        db_session.add(session)
        db_session.commit()

        # 放弃会话
        session.abandon()
        db_session.commit()

        assert session.status == SessionStatus.ABANDONED
        assert session.end_time is not None

    def test_create_pomodoro_settings(self, db_session: Session, create_test_user):
        """测试创建番茄钟设置"""
        user = create_test_user(db_session)

        settings = PomodoroSettings(
            user_id=user.id,
            work_duration=25,
            short_break_duration=5,
            long_break_duration=15,
            long_break_interval=4,
            auto_start_break=True,
            auto_start_work=False,
            sound_enabled=True,
            notification_enabled=True,
            theme="focus"
        )

        db_session.add(settings)
        db_session.commit()
        db_session.refresh(settings)

        assert settings.id is not None
        assert settings.user_id == user.id
        assert settings.work_duration == 25
        assert settings.short_break_duration == 5
        assert settings.long_break_duration == 15
        assert settings.long_break_interval == 4
        assert settings.auto_start_break is True
        assert settings.auto_start_work is False
        assert settings.sound_enabled is True
        assert settings.notification_enabled is True
        assert settings.theme == "focus"

    def test_pomodoro_settings_defaults(self, db_session: Session, create_test_user):
        """测试番茄钟设置默认值"""
        user = create_test_user(db_session)

        settings = PomodoroSettings(user_id=user.id)
        db_session.add(settings)
        db_session.commit()
        db_session.refresh(settings)

        assert settings.work_duration == 25
        assert settings.short_break_duration == 5
        assert settings.long_break_duration == 15
        assert settings.long_break_interval == 4
        assert settings.auto_start_break is True
        assert settings.auto_start_work is False
        assert settings.sound_enabled is True
        assert settings.notification_enabled is True
        assert settings.theme == "default"

    def test_get_next_session_type_work(self, db_session: Session, create_test_user):
        """测试获取下一个会话类型 - 工作"""
        user = create_test_user(db_session)

        settings = PomodoroSettings(user_id=user.id)
        db_session.add(settings)
        db_session.commit()
        db_session.refresh(settings)

        # 第1个工作会话后应该是短休息
        next_type = settings.get_next_session_type(1)
        assert next_type == SessionType.SHORT_BREAK

        # 第2个工作会话后应该是短休息
        next_type = settings.get_next_session_type(2)
        assert next_type == SessionType.SHORT_BREAK

        # 第3个工作会话后应该是短休息
        next_type = settings.get_next_session_type(3)
        assert next_type == SessionType.SHORT_BREAK

        # 第4个工作会话后应该是长休息
        next_type = settings.get_next_session_type(4)
        assert next_type == SessionType.LONG_BREAK

        # 第8个工作会话后应该是长休息
        next_type = settings.get_next_session_type(8)
        assert next_type == SessionType.LONG_BREAK

    def test_pomodoro_session_to_dict(self, db_session: Session, create_test_user):
        """测试会话字典转换"""
        user = create_test_user(db_session)

        session = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.WORK,
            status=SessionStatus.ACTIVE,
            planned_duration=25
        )
        db_session.add(session)
        db_session.commit()

        session_dict = session.to_dict()

        assert "id" in session_dict
        assert "user_id" in session_dict
        assert "session_type" in session_dict
        assert "status" in session_dict
        assert "start_time" in session_dict
        assert "planned_duration" in session_dict
        assert session_dict["session_type"] == "work"
        assert session_dict["status"] == "active"

    def test_pomodoro_settings_to_dict(self, db_session: Session, create_test_user):
        """测试设置字典转换"""
        user = create_test_user(db_session)

        settings = PomodoroSettings(user_id=user.id)
        db_session.add(settings)
        db_session.commit()

        settings_dict = settings.to_dict()

        assert "id" in settings_dict
        assert "user_id" in settings_dict
        assert "work_duration" in settings_dict
        assert "short_break_duration" in settings_dict
        assert "long_break_duration" in settings_dict
        assert "long_break_interval" in settings_dict

    def test_user_pomodoro_relationship(self, db_session: Session, create_test_user):
        """测试用户与番茄钟的关联关系"""
        user = create_test_user(db_session)

        # 创建会话
        session1 = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.WORK,
            planned_duration=25
        )
        session2 = PomodoroSession(
            user_id=user.id,
            session_type=SessionType.SHORT_BREAK,
            planned_duration=5
        )
        db_session.add_all([session1, session2])

        # 创建设置
        settings = PomodoroSettings(user_id=user.id)
        db_session.add(settings)

        db_session.commit()

        # 验证关联
        assert len(user.pomodoro_sessions) == 2
        assert user.pomodoro_settings is not None
        assert user.pomodoro_settings.work_duration == 25

    def test_session_type_enum_values(self):
        """测试会话类型枚举值"""
        assert SessionType.WORK.value == "work"
        assert SessionType.SHORT_BREAK.value == "short_break"
        assert SessionType.LONG_BREAK.value == "long_break"

    def test_session_status_enum_values(self):
        """测试会话状态枚举值"""
        assert SessionStatus.ACTIVE.value == "active"
        assert SessionStatus.PAUSED.value == "paused"
        assert SessionStatus.COMPLETED.value == "completed"
        assert SessionStatus.ABANDONED.value == "abandoned"

    def test_pomodoro_session_unique_constraint(self, db_session: Session, create_test_user):
        """测试用户ID唯一性约束"""
        user = create_test_user(db_session)

        # 创建第一个设置
        settings1 = PomodoroSettings(user_id=user.id)
        db_session.add(settings1)
        db_session.commit()

        # 尝试创建第二个相同用户的设置应该失败
        settings2 = PomodoroSettings(user_id=user.id)
        db_session.add(settings2)

        with pytest.raises(Exception):  # 应该抛出唯一性约束错误
            db_session.commit()

    def test_custom_pomodoro_settings(self, db_session: Session, create_test_user):
        """测试自定义番茄钟设置"""
        user = create_test_user(db_session)

        settings = PomodoroSettings(
            user_id=user.id,
            work_duration=30,
            short_break_duration=10,
            long_break_duration=20,
            long_break_interval=3
        )
        db_session.add(settings)
        db_session.commit()

        assert settings.work_duration == 30
        assert settings.short_break_duration == 10
        assert settings.long_break_duration == 20
        assert settings.long_break_interval == 3

        # 测试自定义间隔逻辑
        assert settings.get_next_session_type(1) == SessionType.SHORT_BREAK
        assert settings.get_next_session_type(2) == SessionType.SHORT_BREAK
        assert settings.get_next_session_type(3) == SessionType.LONG_BREAK  # 第3个后是长休息


if __name__ == "__main__":
    pytest.main([__file__])