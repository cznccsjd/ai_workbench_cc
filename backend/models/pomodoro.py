#
# 番茄钟数据库模型
# 定义番茄钟会话和用户设置的数据结构
#

from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
import uuid
import enum

class SessionType(enum.Enum):
    """会话类型枚举"""
    WORK = "work"
    SHORT_BREAK = "short_break"
    LONG_BREAK = "long_break"

class SessionStatus(enum.Enum):
    """会话状态枚举"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class PomodoroSession(Base):
    """番茄钟会话模型"""
    __tablename__ = "pomodoro_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    # 会话信息
    session_type = Column(Enum(SessionType), nullable=False, default=SessionType.WORK)
    status = Column(Enum(SessionStatus), nullable=False, default=SessionStatus.ACTIVE)

    # 时间信息
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)  # 暂停时间点

    # 时长信息（分钟）
    planned_duration = Column(Integer, nullable=False)  # 计划时长
    actual_duration = Column(Integer, nullable=True)  # 实际时长

    # 累积暂停时间（分钟）
    total_pause_duration = Column(Integer, default=0)

    # 完成计数
    completed_pomodoros_count = Column(Integer, default=0)  # 本次会话前完成的番茄钟数量

    # 元数据
    notes = Column(String(500), default="")  # 会话备注

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    user = relationship("User", back_populates="pomodoro_sessions")

    def __repr__(self):
        return f"<PomodoroSession(id='{self.id}', user_id='{self.user_id}', type='{self.session_type.value}', status='{self.status.value}')>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_type": self.session_type.value,
            "status": self.status.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "paused_at": self.paused_at.isoformat() if self.paused_at else None,
            "planned_duration": self.planned_duration,
            "actual_duration": self.actual_duration,
            "total_pause_duration": self.total_pause_duration,
            "completed_pomodoros_count": self.completed_pomodoros_count,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def pause(self):
        """暂停会话"""
        if self.status == SessionStatus.ACTIVE:
            self.status = SessionStatus.PAUSED
            self.paused_at = func.now()

    def resume(self):
        """恢复会话"""
        if self.status == SessionStatus.PAUSED:
            self.status = SessionStatus.ACTIVE
            if self.paused_at:
                # 计算暂停时长（分钟）
                from datetime import datetime
                pause_duration = int((datetime.now() - self.paused_at).total_seconds() / 60)
                self.total_pause_duration += pause_duration
                self.paused_at = None

    def complete(self):
        """完成会话"""
        if self.status in [SessionStatus.ACTIVE, SessionStatus.PAUSED]:
            self.status = SessionStatus.COMPLETED
            from datetime import datetime
            self.end_time = datetime.now()
            # 计算实际时长（分钟）
            if self.start_time and self.end_time:
                total_duration = int((self.end_time - self.start_time).total_seconds() / 60)
                self.actual_duration = total_duration - self.total_pause_duration

    def abandon(self):
        """放弃会话"""
        if self.status in [SessionStatus.ACTIVE, SessionStatus.PAUSED]:
            self.status = SessionStatus.ABANDONED
            from datetime import datetime
            self.end_time = datetime.now()

class PomodoroSettings(Base):
    """番茄钟用户设置模型"""
    __tablename__ = "pomodoro_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)

    # 基础时长设置（分钟）
    work_duration = Column(Integer, nullable=False, default=25)
    short_break_duration = Column(Integer, nullable=False, default=5)
    long_break_duration = Column(Integer, nullable=False, default=15)

    # 长休息间隔（多少个番茄钟后长休息）
    long_break_interval = Column(Integer, nullable=False, default=4)

    # 自动开始休息
    auto_start_break = Column(Boolean, default=True)
    auto_start_work = Column(Boolean, default=False)

    # 通知设置
    sound_enabled = Column(Boolean, default=True)
    notification_enabled = Column(Boolean, default=True)

    # 主题设置
    theme = Column(String(20), default="default")  # default, minimal, focus

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    user = relationship("User", back_populates="pomodoro_settings")

    def __repr__(self):
        return f"<PomodoroSettings(user_id='{self.user_id}', work_duration={self.work_duration}, short_break={self.short_break_duration})>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "work_duration": self.work_duration,
            "short_break_duration": self.short_break_duration,
            "long_break_duration": self.long_break_duration,
            "long_break_interval": self.long_break_interval,
            "auto_start_break": self.auto_start_break,
            "auto_start_work": self.auto_start_work,
            "sound_enabled": self.sound_enabled,
            "notification_enabled": self.notification_enabled,
            "theme": self.theme,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def get_next_session_type(self, completed_work_sessions: int) -> SessionType:
        """
        根据已完成的工作会话数量确定下一个会话类型

        Args:
            completed_work_sessions: 已完成的工作会话数量

        Returns:
            SessionType: 下一个会话类型
        """
        # 如果当前是长休息间隔的倍数，下一个应该是长休息
        if completed_work_sessions > 0 and completed_work_sessions % self.long_break_interval == 0:
            return SessionType.LONG_BREAK
        # 否则是短休息
        else:
            return SessionType.SHORT_BREAK