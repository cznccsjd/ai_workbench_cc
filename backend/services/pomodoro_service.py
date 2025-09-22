#
# 番茄钟业务逻辑服务
# 处理番茄钟的核心业务逻辑、状态管理和统计计算
#

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract

from models.pomodoro import PomodoroSession, PomodoroSettings, SessionType, SessionStatus
from models.user import User

logger = logging.getLogger(__name__)

class PomodoroService:
    """番茄钟服务类"""

    def __init__(self, db_session: Session):
        """
        初始化服务

        Args:
            db_session: 数据库会话
        """
        self.db = db_session

    def create_session(self, user_id: str, session_type: SessionType, planned_duration: int,
                      completed_pomodoros_count: int = 0, notes: str = "") -> PomodoroSession:
        """
        创建新的番茄钟会话

        Args:
            user_id: 用户ID
            session_type: 会话类型
            planned_duration: 计划时长（分钟）
            completed_pomodoros_count: 已完成番茄钟数量
            notes: 会话备注

        Returns:
            PomodoroSession: 创建的会话对象
        """
        try:
            # 检查是否已有活跃的会话
            active_session = self.get_active_session(user_id)
            if active_session:
                logger.warning(f"用户 {user_id} 已存在活跃会话 {active_session.id}")
                raise ValueError("已存在活跃的番茄钟会话")

            session = PomodoroSession(
                user_id=user_id,
                session_type=session_type,
                status=SessionStatus.ACTIVE,
                planned_duration=planned_duration,
                completed_pomodoros_count=completed_pomodoros_count,
                notes=notes
            )

            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)

            logger.info(f"创建番茄钟会话成功: user_id={user_id}, session_id={session.id}, "
                       f"type={session_type.value}, duration={planned_duration}分钟")
            return session

        except Exception as e:
            self.db.rollback()
            logger.error(f"创建番茄钟会话失败: user_id={user_id}, error={str(e)}")
            raise

    def get_active_session(self, user_id: str) -> Optional[PomodoroSession]:
        """
        获取用户的活跃会话

        Args:
            user_id: 用户ID

        Returns:
            Optional[PomodoroSession]: 活跃会话或None
        """
        return self.db.query(PomodoroSession).filter(
            and_(
                PomodoroSession.user_id == user_id,
                PomodoroSession.status.in_([SessionStatus.ACTIVE, SessionStatus.PAUSED])
            )
        ).first()

    def get_session(self, session_id: str, user_id: str) -> Optional[PomodoroSession]:
        """
        获取指定会话

        Args:
            session_id: 会话ID
            user_id: 用户ID

        Returns:
            Optional[PomodoroSession]: 会话对象或None
        """
        return self.db.query(PomodoroSession).filter(
            and_(
                PomodoroSession.id == session_id,
                PomodoroSession.user_id == user_id
            )
        ).first()

    def pause_session(self, session_id: str, user_id: str) -> PomodoroSession:
        """
        暂停会话

        Args:
            session_id: 会话ID
            user_id: 用户ID

        Returns:
            PomodoroSession: 更新后的会话
        """
        session = self.get_session(session_id, user_id)
        if not session:
            raise ValueError("会话不存在")

        if session.status != SessionStatus.ACTIVE:
            raise ValueError("会话不在活跃状态，无法暂停")

        session.pause()
        self.db.commit()
        self.db.refresh(session)

        logger.info(f"暂停番茄钟会话: session_id={session_id}, user_id={user_id}")
        return session

    def resume_session(self, session_id: str, user_id: str) -> PomodoroSession:
        """
        恢复会话

        Args:
            session_id: 会话ID
            user_id: 用户ID

        Returns:
            PomodoroSession: 更新后的会话
        """
        session = self.get_session(session_id, user_id)
        if not session:
            raise ValueError("会话不存在")

        if session.status != SessionStatus.PAUSED:
            raise ValueError("会话不在暂停状态，无法恢复")

        session.resume()
        self.db.commit()
        self.db.refresh(session)

        logger.info(f"恢复番茄钟会话: session_id={session_id}, user_id={user_id}")
        return session

    def complete_session(self, session_id: str, user_id: str) -> PomodoroSession:
        """
        完成会话

        Args:
            session_id: 会话ID
            user_id: 用户ID

        Returns:
            PomodoroSession: 更新后的会话
        """
        session = self.get_session(session_id, user_id)
        if not session:
            raise ValueError("会话不存在")

        if session.status not in [SessionStatus.ACTIVE, SessionStatus.PAUSED]:
            raise ValueError("会话状态无效，无法完成")

        session.complete()
        self.db.commit()
        self.db.refresh(session)

        logger.info(f"完成番茄钟会话: session_id={session_id}, user_id={user_id}, "
                   f"actual_duration={session.actual_duration}分钟")
        return session

    def abandon_session(self, session_id: str, user_id: str) -> PomodoroSession:
        """
        放弃会话

        Args:
            session_id: 会话ID
            user_id: 用户ID

        Returns:
            PomodoroSession: 更新后的会话
        """
        session = self.get_session(session_id, user_id)
        if not session:
            raise ValueError("会话不存在")

        if session.status not in [SessionStatus.ACTIVE, SessionStatus.PAUSED]:
            raise ValueError("会话状态无效，无法放弃")

        session.abandon()
        self.db.commit()
        self.db.refresh(session)

        logger.info(f"放弃番茄钟会话: session_id={session_id}, user_id={user_id}")
        return session

    def get_session_history(self, user_id: str, limit: int = 50, offset: int = 0) -> List[PomodoroSession]:
        """
        获取用户的会话历史

        Args:
            user_id: 用户ID
            limit: 返回数量限制
            offset: 偏移量

        Returns:
            List[PomodoroSession]: 会话列表
        """
        return self.db.query(PomodoroSession).filter(
            PomodoroSession.user_id == user_id
        ).order_by(PomodoroSession.created_at.desc()).offset(offset).limit(limit).all()

    def get_or_create_settings(self, user_id: str) -> PomodoroSettings:
        """
        获取或创建用户设置

        Args:
            user_id: 用户ID

        Returns:
            PomodoroSettings: 用户设置
        """
        settings = self.db.query(PomodoroSettings).filter(
            PomodoroSettings.user_id == user_id
        ).first()

        if not settings:
            settings = PomodoroSettings(user_id=user_id)
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
            logger.info(f"创建默认番茄钟设置: user_id={user_id}")

        return settings

    def update_settings(self, user_id: str, **kwargs) -> PomodoroSettings:
        """
        更新用户设置

        Args:
            user_id: 用户ID
            **kwargs: 更新的设置参数

        Returns:
            PomodoroSettings: 更新后的设置
        """
        settings = self.get_or_create_settings(user_id)

        # 只允许更新指定的字段
        allowed_fields = {
            'work_duration', 'short_break_duration', 'long_break_duration',
            'long_break_interval', 'auto_start_break', 'auto_start_work',
            'sound_enabled', 'notification_enabled', 'theme'
        }

        for field, value in kwargs.items():
            if field in allowed_fields:
                setattr(settings, field, value)

        self.db.commit()
        self.db.refresh(settings)

        logger.info(f"更新番茄钟设置: user_id={user_id}, updated_fields={list(kwargs.keys())}")
        return settings

    def get_statistics(self, user_id: str, period: str = 'daily') -> Dict[str, Any]:
        """
        获取番茄钟统计信息

        Args:
            user_id: 用户ID
            period: 统计周期 ('daily', 'weekly', 'monthly')

        Returns:
            Dict[str, Any]: 统计信息
        """
        now = datetime.now()

        if period == 'daily':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'weekly':
            start_date = now - timedelta(days=7)
        elif period == 'monthly':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            raise ValueError("无效的统计周期")

        # 基础统计
        completed_sessions = self.db.query(PomodoroSession).filter(
            and_(
                PomodoroSession.user_id == user_id,
                PomodoroSession.status == SessionStatus.COMPLETED,
                PomodoroSession.created_at >= start_date
            )
        ).all()

        # 按类型统计
        work_sessions = [s for s in completed_sessions if s.session_type == SessionType.WORK]
        break_sessions = [s for s in completed_sessions if s.session_type != SessionType.WORK]

        # 计算总时长
        total_work_time = sum(s.actual_duration or 0 for s in work_sessions)
        total_break_time = sum(s.actual_duration or 0 for s in break_sessions)

        # 计算平均专注时长
        avg_focus_duration = total_work_time / len(work_sessions) if work_sessions else 0

        # 计算每日平均
        days_count = (now - start_date).days + 1
        daily_avg_sessions = len(completed_sessions) / days_count
        daily_avg_work_time = total_work_time / days_count

        # 会话状态分布
        status_distribution = {
            'completed': len([s for s in completed_sessions]),
            'abandoned': self.db.query(PomodoroSession).filter(
                and_(
                    PomodoroSession.user_id == user_id,
                    PomodoroSession.status == SessionStatus.ABANDONED,
                    PomodoroSession.created_at >= start_date
                )
            ).count()
        }

        # 完成率
        total_sessions = len(completed_sessions) + status_distribution['abandoned']
        completion_rate = (len(completed_sessions) / total_sessions * 100) if total_sessions > 0 else 0

        statistics = {
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': now.isoformat(),
            'total_sessions': len(completed_sessions),
            'work_sessions': len(work_sessions),
            'break_sessions': len(break_sessions),
            'total_work_time': total_work_time,
            'total_break_time': total_break_time,
            'average_focus_duration': round(avg_focus_duration, 2),
            'daily_average_sessions': round(daily_avg_sessions, 2),
            'daily_average_work_time': round(daily_avg_work_time, 2),
            'completion_rate': round(completion_rate, 2),
            'status_distribution': status_distribution
        }

        logger.info(f"获取番茄钟统计: user_id={user_id}, period={period}, "
                   f"total_sessions={statistics['total_sessions']}")
        return statistics

    def get_next_recommended_session(self, user_id: str) -> Dict[str, Any]:
        """
        获取推荐的下一个会话类型和时长

        Args:
            user_id: 用户ID

        Returns:
            Dict[str, Any]: 推荐信息
        """
        settings = self.get_or_create_settings(user_id)

        # 获取今日完成的会话
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = self.db.query(PomodoroSession).filter(
            and_(
                PomodoroSession.user_id == user_id,
                PomodoroSession.status == SessionStatus.COMPLETED,
                PomodoroSession.created_at >= today,
                PomodoroSession.session_type == SessionType.WORK
            )
        ).all()

        completed_work_sessions = len(today_sessions)

        # 如果没有完成任何工作会话，推荐工作会话
        if completed_work_sessions == 0:
            next_session_type = SessionType.WORK
        else:
            # 根据设置确定下一个会话类型
            next_session_type = settings.get_next_session_type(completed_work_sessions)

        # 确定时长
        if next_session_type == SessionType.WORK:
            duration = settings.work_duration
        elif next_session_type == SessionType.SHORT_BREAK:
            duration = settings.short_break_duration
        else:  # LONG_BREAK
            duration = settings.long_break_duration

        recommendation = {
            'session_type': next_session_type.value,
            'recommended_duration': duration,
            'completed_work_sessions_today': completed_work_sessions,
            'user_settings': settings.to_dict()
        }

        logger.info(f"获取下一个推荐会话: user_id={user_id}, "
                   f"next_type={next_session_type.value}, duration={duration}")
        return recommendation


# 创建服务实例
def get_pomodoro_service(db: Session) -> PomodoroService:
    """获取Pomodoro服务实例"""
    return PomodoroService(db)