#
# 番茄钟API路由
# 处理番茄钟会话管理、统计和设置等操作
#

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from services.pomodoro_service import PomodoroService
from models.pomodoro import PomodoroSession, PomodoroSettings, SessionType, SessionStatus
from database.base import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# 请求/响应模型
class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    session_type: str = Field(..., description="会话类型: work, short_break, long_break")
    planned_duration: int = Field(..., ge=1, le=120, description="计划时长(分钟)")
    completed_pomodoros_count: int = Field(0, ge=0, description="已完成番茄钟数量")
    notes: Optional[str] = Field(None, max_length=500, description="会话备注")

    class Config:
        json_schema_extra = {
            "example": {
                "session_type": "work",
                "planned_duration": 25,
                "completed_pomodoros_count": 0,
                "notes": "开始专注工作"
            }
        }

class UpdateSessionRequest(BaseModel):
    """更新会话请求"""
    action: str = Field(..., description="操作类型: pause, resume, complete, abandon")

    class Config:
        json_schema_extra = {
            "example": {
                "action": "pause"
            }
        }

class UpdateSettingsRequest(BaseModel):
    """更新设置请求"""
    work_duration: Optional[int] = Field(None, ge=1, le=60, description="工作时长(分钟)")
    short_break_duration: Optional[int] = Field(None, ge=1, le=30, description="短休息时长(分钟)")
    long_break_duration: Optional[int] = Field(None, ge=1, le=60, description="长休息时长(分钟)")
    long_break_interval: Optional[int] = Field(None, ge=2, le=10, description="长休息间隔(番茄钟数量)")
    auto_start_break: Optional[bool] = Field(None, description="自动开始休息")
    auto_start_work: Optional[bool] = Field(None, description="自动开始工作")
    sound_enabled: Optional[bool] = Field(None, description="声音提醒")
    notification_enabled: Optional[bool] = Field(None, description="通知提醒")
    theme: Optional[str] = Field(None, description="主题: default, minimal, focus")

    class Config:
        json_schema_extra = {
            "example": {
                "work_duration": 30,
                "short_break_duration": 5,
                "auto_start_break": False
            }
        }

class SessionResponse(BaseModel):
    """会话响应"""
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_type: str
    status: str
    start_time: Optional[str]
    end_time: Optional[str]
    paused_at: Optional[str]
    planned_duration: int
    actual_duration: Optional[int]
    total_pause_duration: int
    completed_pomodoros_count: int
    notes: str
    created_at: Optional[str]
    updated_at: Optional[str]

class SettingsResponse(BaseModel):
    """设置响应"""
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    work_duration: int
    short_break_duration: int
    long_break_duration: int
    long_break_interval: int
    auto_start_break: bool
    auto_start_work: bool
    sound_enabled: bool
    notification_enabled: bool
    theme: str
    created_at: Optional[str]
    updated_at: Optional[str]

class StatisticsResponse(BaseModel):
    """统计响应"""
    period: str
    start_date: Optional[str]
    end_date: Optional[str]
    total_sessions: int
    work_sessions: int
    break_sessions: int
    total_work_time: int
    total_break_time: int
    average_focus_duration: float
    daily_average_sessions: float
    daily_average_work_time: float
    completion_rate: float
    status_distribution: Dict[str, int]

class RecommendationResponse(BaseModel):
    """推荐响应"""
    session_type: str
    recommended_duration: int
    completed_work_sessions_today: int
    user_settings: Dict[str, Any]

class SessionListResponse(BaseModel):
    """会话列表响应"""
    sessions: List[SessionResponse]
    total: int
    page: int
    page_size: int

class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = False
    message: str
    error_code: Optional[str] = None

# 辅助函数
def validate_session_type(session_type: str) -> SessionType:
    """验证会话类型"""
    try:
        return SessionType(session_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"无效的会话类型: {session_type}。有效值: {[t.value for t in SessionType]}"
        )

def validate_action(action: str) -> str:
    """验证操作类型"""
    valid_actions = ["pause", "resume", "complete", "abandon"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"无效的操作: {action}。有效值: {valid_actions}"
        )
    return action

# API端点
@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest,
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    创建新的番茄钟会话

    - **session_type**: 会话类型 (work, short_break, long_break)
    - **planned_duration**: 计划时长 (1-120分钟)
    - **completed_pomodoros_count**: 已完成番茄钟数量
    - **notes**: 会话备注 (可选)
    """
    try:
        logger.info(f"创建番茄钟会话请求: user={current_user}, type={request.session_type}")

        session_type = validate_session_type(request.session_type)

        service = PomodoroService(db)
        session = service.create_session(
            user_id=current_user,
            session_type=session_type,
            planned_duration=request.planned_duration,
            completed_pomodoros_count=request.completed_pomodoros_count,
            notes=request.notes or ""
        )

        return session.to_dict()

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"创建会话失败: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"创建会话异常: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=500, detail="创建会话失败")

@router.get("/sessions", response_model=SessionListResponse)
async def get_sessions(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    获取用户的番茄钟会话历史

    - **page**: 页码 (从1开始)
    - **page_size**: 每页数量 (1-100)
    """
    try:
        logger.info(f"获取会话历史: user={current_user}, page={page}, page_size={page_size}")

        service = PomodoroService(db)
        offset = (page - 1) * page_size
        sessions = service.get_session_history(
            user_id=current_user,
            limit=page_size,
            offset=offset
        )

        total_sessions = len(sessions)  # 简化处理，实际应该查询总数

        return {
            "sessions": [session.to_dict() for session in sessions],
            "total": total_sessions,
            "page": page,
            "page_size": page_size
        }

    except Exception as e:
        logger.error(f"获取会话历史失败: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=500, detail="获取会话历史失败")

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    获取指定的番茄钟会话详情

    - **session_id**: 会话ID
    """
    try:
        logger.info(f"获取会话详情: user={current_user}, session_id={session_id}")

        service = PomodoroService(db)
        session = service.get_session(session_id, current_user)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        return session.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取会话详情失败: user={current_user}, session_id={session_id}, error={str(e)}")
        raise HTTPException(status_code=500, detail="获取会话详情失败")

@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    request: UpdateSessionRequest,
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    更新番茄钟会话状态

    - **session_id**: 会话ID
    - **action**: 操作类型 (pause, resume, complete, abandon)
    """
    try:
        logger.info(f"更新会话状态: user={current_user}, session_id={session_id}, action={request.action}")

        action = validate_action(request.action)

        service = PomodoroService(db)
        if action == "pause":
            session = service.pause_session(session_id, current_user)
        elif action == "resume":
            session = service.resume_session(session_id, current_user)
        elif action == "complete":
            session = service.complete_session(session_id, current_user)
        elif action == "abandon":
            session = service.abandon_session(session_id, current_user)
        else:
            raise HTTPException(status_code=400, detail="不支持的操作类型")

        return session.to_dict()

    except ValueError as e:
        logger.warning(f"更新会话状态失败: user={current_user}, session_id={session_id}, error={str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新会话状态异常: user={current_user}, session_id={session_id}, error={str(e)}")
        raise HTTPException(status_code=500, detail="更新会话状态失败")

@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    period: str = Query("daily", regex="^(daily|weekly|monthly)$", description="统计周期"),
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    获取番茄钟统计信息

    - **period**: 统计周期 (daily, weekly, monthly)
    """
    try:
        logger.info(f"获取统计信息: user={current_user}, period={period}")

        service = PomodoroService(db)
        statistics = service.get_statistics(current_user, period)
        return statistics

    except ValueError as e:
        logger.warning(f"获取统计信息失败: user={current_user}, period={period}, error={str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"获取统计信息异常: user={current_user}, period={period}, error={str(e)}")
        raise HTTPException(status_code=500, detail="获取统计信息失败")

@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    获取用户的番茄钟设置
    """
    try:
        logger.info(f"获取设置: user={current_user}")

        service = PomodoroService(db)
        settings = service.get_or_create_settings(current_user)
        return settings.to_dict()

    except Exception as e:
        logger.error(f"获取设置失败: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=500, detail="获取设置失败")

@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    request: UpdateSettingsRequest,
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    更新用户的番茄钟设置

    - **work_duration**: 工作时长 (1-60分钟)
    - **short_break_duration**: 短休息时长 (1-30分钟)
    - **long_break_duration**: 长休息时长 (1-60分钟)
    - **long_break_interval**: 长休息间隔 (2-10个番茄钟)
    - **auto_start_break**: 自动开始休息
    - **auto_start_work**: 自动开始工作
    - **sound_enabled**: 声音提醒
    - **notification_enabled**: 通知提醒
    - **theme**: 主题 (default, minimal, focus)
    """
    try:
        logger.info(f"更新设置: user={current_user}")

        # 验证主题值
        if request.theme and request.theme not in ["default", "minimal", "focus"]:
            raise HTTPException(
                status_code=400,
                detail=f"无效的主题: {request.theme}。有效值: [default, minimal, focus]"
            )

        # 构建更新参数字典
        update_params = request.model_dump(exclude_unset=True)

        service = PomodoroService(db)
        settings = service.update_settings(current_user, **update_params)
        return settings.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新设置失败: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=500, detail="更新设置失败")

@router.get("/next-recommendation", response_model=RecommendationResponse)
async def get_next_recommendation(
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    获取推荐的下一个番茄钟会话

    根据用户今天的完成情况和设置，推荐合适的会话类型和时长
    """
    try:
        logger.info(f"获取下一个推荐会话: user={current_user}")

        service = PomodoroService(db)
        recommendation = service.get_next_recommended_session(current_user)
        return recommendation

    except Exception as e:
        logger.error(f"获取推荐会话失败: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=500, detail="获取推荐会话失败")

@router.get("/active-session", response_model=SessionResponse)
async def get_active_session(
    current_user: str = Depends(lambda: "test_user@example.com"),  # 临时用户
    db: Session = Depends(get_db)
):
    """
    获取当前活跃的番茄钟会话

    如果没有活跃会话，返回404错误
    """
    try:
        logger.info(f"获取活跃会话: user={current_user}")

        service = PomodoroService(db)
        session = service.get_active_session(current_user)
        if session:
            return session.to_dict()
        else:
            raise HTTPException(status_code=404, detail="没有活跃的番茄钟会话")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取活跃会话失败: user={current_user}, error={str(e)}")
        raise HTTPException(status_code=500, detail="获取活跃会话失败")