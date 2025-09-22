#
# 项目管理看板Pydantic模型
# 用于API请求/响应的数据验证
#

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# 枚举定义
class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class CardStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    ARCHIVED = "archived"

# ===== Board 模型 =====
class BoardBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="看板名称")
    description: Optional[str] = Field(None, max_length=1000, description="看板描述")
    background_color: Optional[str] = Field("#FFFFFF", pattern=r"^#[0-9A-Fa-f]{6}$", description="背景颜色")
    background_image: Optional[str] = Field(None, max_length=500, description="背景图片URL")

class BoardCreate(BoardBase):
    """创建看板请求模型"""
    pass

class BoardUpdate(BaseModel):
    """更新看板请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    background_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    background_image: Optional[str] = Field(None, max_length=500)
    is_archived: Optional[bool] = None

class BoardResponse(BoardBase):
    """看板响应模型"""
    id: str
    user_id: str
    is_archived: bool
    position: int
    created_at: datetime
    updated_at: datetime
    lists: List['ListResponse'] = []

    class Config:
        orm_mode = True

# ===== List 模型 =====
class ListBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="列表名称")
    description: Optional[str] = Field(None, max_length=1000, description="列表描述")
    position: int = Field(0, ge=0, description="在面板中的位置")

class ListCreate(ListBase):
    """创建列表请求模型"""
    board_id: str = Field(..., description="所属看板ID")

class ListUpdate(BaseModel):
    """更新列表请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    position: Optional[int] = Field(None, ge=0)
    is_archived: Optional[bool] = None

class ListResponse(ListBase):
    """列表响应模型"""
    id: str
    board_id: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    cards: List['CardResponse'] = []

    class Config:
        orm_mode = True

# ===== Card 模型 =====
class CardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, description="卡片标题")
    description: Optional[str] = Field(None, description="卡片描述，支持Markdown")
    position: int = Field(0, ge=0, description="在列表中的位置")
    due_date: Optional[datetime] = Field(None, description="截止日期")
    priority: PriorityLevel = Field(PriorityLevel.MEDIUM, description="优先级")
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="卡片颜色")
    tags: List[str] = Field(default_factory=list, description="标签列表")

class CardCreate(CardBase):
    """创建卡片请求模型"""
    list_id: str = Field(..., description="所属列表ID")

class CardUpdate(BaseModel):
    """更新卡片请求模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None)
    position: Optional[int] = Field(None, ge=0)
    due_date: Optional[datetime] = Field(None)
    priority: Optional[PriorityLevel] = None
    is_completed: Optional[bool] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    tags: Optional[List[str]] = None

class CardMoveRequest(BaseModel):
    """卡片移动请求模型"""
    source_list_id: str = Field(..., description="源列表ID")
    target_list_id: str = Field(..., description="目标列表ID")
    new_position: int = Field(..., ge=0, description="新位置")

class CardReorderRequest(BaseModel):
    """卡片重新排序请求模型"""
    new_position: int = Field(..., ge=0, description="新位置")

class CardResponse(CardBase):
    """卡片响应模型"""
    id: str
    list_id: str
    is_completed: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        orm_mode = True

# ===== 看板统计模型 =====
class BoardStats(BaseModel):
    """看板统计信息"""
    total_cards: int
    completed_cards: int
    overdue_cards: int
    cards_by_priority: Dict[str, int]
    cards_by_list: Dict[str, int]

# ===== 批量操作模型 =====
class BulkCardUpdate(BaseModel):
    """批量更新卡片请求"""
    card_ids: List[str] = Field(..., min_items=1, description="要更新的卡片ID列表")
    updates: CardUpdate = Field(..., description="要应用的更新")

class BulkCardMove(BaseModel):
    """批量移动卡片请求"""
    card_ids: List[str] = Field(..., min_items=1, description="要移动的卡片ID列表")
    target_list_id: str = Field(..., description="目标列表ID")

# ===== 搜索和过滤模型 =====
class CardFilter(BaseModel):
    """卡片过滤条件"""
    list_ids: Optional[List[str]] = Field(None, description="列表ID过滤")
    priorities: Optional[List[PriorityLevel]] = Field(None, description="优先级过滤")
    is_completed: Optional[bool] = Field(None, description="完成状态过滤")
    has_due_date: Optional[bool] = Field(None, description="是否有截止日期")
    is_overdue: Optional[bool] = Field(None, description="是否已过期")
    tags: Optional[List[str]] = Field(None, description="标签过滤")

class SearchRequest(BaseModel):
    """搜索请求模型"""
    query: str = Field(..., min_length=1, description="搜索关键词")
    board_id: Optional[str] = Field(None, description="限定看板范围")
    include_archived: bool = Field(False, description="是否包含已归档内容")

class SearchResponse(BaseModel):
    """搜索响应模型"""
    cards: List[CardResponse]
    total_count: int
    query: str

# 解决前向引用
BoardResponse.update_forward_refs()
ListResponse.update_forward_refs()