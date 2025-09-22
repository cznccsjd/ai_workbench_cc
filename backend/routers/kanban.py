#
# 项目管理看板API路由
# 提供看板、列表、卡片的CRUD操作和拖拽功能
#

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from sqlalchemy.orm import Session
from database.base import get_db
from models.user import User
from models.kanban import Board, List, Card
from schemas.kanban import (
    BoardCreate, BoardUpdate, BoardResponse, BoardStats,
    ListCreate, ListUpdate, ListResponse,
    CardCreate, CardUpdate, CardResponse, CardMoveRequest,
    BulkCardUpdate, BulkCardMove, CardFilter, SearchRequest, SearchResponse
)
from services.auth_service import get_current_user
from services.kanban_service import KanbanService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kanban", tags=["kanban"])

# ===== 看板相关端点 =====

@router.get("/boards", response_model=List[BoardResponse])
async def get_boards(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="返回数量限制"),
    include_archived: bool = Query(False, description="是否包含已归档看板"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """获取用户的所有看板"""
    try:
        boards = kanban_service.get_user_boards(
            db, current_user.id, skip, limit, include_archived
        )
        return boards
    except Exception as e:
        logger.error(f"Failed to get boards for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="获取看板列表失败")

@router.post("/boards", response_model=BoardResponse)
async def create_board(
    board_data: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """创建新看板"""
    try:
        board = kanban_service.create_board(db, current_user.id, board_data)
        return board
    except Exception as e:
        logger.error(f"Failed to create board for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="创建看板失败")

@router.get("/boards/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: str = Path(..., description="看板ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """获取指定看板详情（包含所有列表和卡片）"""
    try:
        board = kanban_service.get_board_with_lists_and_cards(db, board_id, current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="看板不存在")
        return board
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get board {board_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="获取看板详情失败")

@router.put("/boards/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: str,
    board_data: BoardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """更新看板信息"""
    try:
        board = kanban_service.update_board(db, board_id, current_user.id, board_data)
        if not board:
            raise HTTPException(status_code=404, detail="看板不存在或无权限")
        return board
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update board {board_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="更新看板失败")

@router.delete("/boards/{board_id}")
async def delete_board(
    board_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """删除看板（软删除）"""
    try:
        success = kanban_service.delete_board(db, board_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="看板不存在或无权限")
        return {"message": "看板已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete board {board_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="删除看板失败")

@router.get("/boards/{board_id}/stats", response_model=BoardStats)
async def get_board_stats(
    board_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """获取看板统计信息"""
    try:
        stats = kanban_service.get_board_stats(db, board_id, current_user.id)
        if not stats:
            raise HTTPException(status_code=404, detail="看板不存在")
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get board stats {board_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="获取看板统计失败")

# ===== 列表相关端点 =====

@router.post("/lists", response_model=ListResponse)
async def create_list(
    list_data: ListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """创建新列表"""
    try:
        lst = kanban_service.create_list(db, current_user.id, list_data)
        return lst
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to create list: {str(e)}")
        raise HTTPException(status_code=500, detail="创建列表失败")

@router.put("/lists/{list_id}", response_model=ListResponse)
async def update_list(
    list_id: str,
    list_data: ListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """更新列表信息"""
    try:
        lst = kanban_service.update_list(db, list_id, current_user.id, list_data)
        if not lst:
            raise HTTPException(status_code=404, detail="列表不存在或无权限")
        return lst
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update list {list_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="更新列表失败")

@router.delete("/lists/{list_id}")
async def delete_list(
    list_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """删除列表"""
    try:
        success = kanban_service.delete_list(db, list_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="列表不存在或无权限")
        return {"message": "列表已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete list {list_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="删除列表失败")

# ===== 卡片相关端点 =====

@router.post("/cards", response_model=CardResponse)
async def create_card(
    card_data: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """创建新卡片"""
    try:
        card = kanban_service.create_card(db, current_user.id, card_data)
        return card
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to create card: {str(e)}")
        raise HTTPException(status_code=500, detail="创建卡片失败")

@router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(
    card_id: str = Path(..., description="卡片ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """获取指定卡片详情"""
    try:
        card = kanban_service.get_card(db, card_id, current_user.id)
        if not card:
            raise HTTPException(status_code=404, detail="卡片不存在")
        return card
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get card {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="获取卡片详情失败")

@router.put("/cards/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: str,
    card_data: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """更新卡片信息"""
    try:
        card = kanban_service.update_card(db, card_id, current_user.id, card_data)
        if not card:
            raise HTTPException(status_code=404, detail="卡片不存在或无权限")
        return card
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update card {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="更新卡片失败")

@router.delete("/cards/{card_id}")
async def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """删除卡片"""
    try:
        success = kanban_service.delete_card(db, card_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="卡片不存在或无权限")
        return {"message": "卡片已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete card {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="删除卡片失败")

# ===== 拖拽和批量操作端点 =====

@router.post("/cards/move", response_model=CardResponse)
async def move_card(
    move_data: CardMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """移动卡片到不同列表或位置（拖拽操作）"""
    try:
        card = kanban_service.move_card(db, current_user.id, move_data)
        if not card:
            raise HTTPException(status_code=404, detail="卡片或目标列表不存在")
        return card
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to move card: {str(e)}")
        raise HTTPException(status_code=500, detail="移动卡片失败")

@router.post("/cards/bulk-update")
async def bulk_update_cards(
    bulk_data: BulkCardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """批量更新卡片"""
    try:
        updated_count = kanban_service.bulk_update_cards(db, current_user.id, bulk_data)
        return {"message": f"已更新 {updated_count} 张卡片"}
    except Exception as e:
        logger.error(f"Failed to bulk update cards: {str(e)}")
        raise HTTPException(status_code=500, detail="批量更新卡片失败")

@router.post("/cards/bulk-move")
async def bulk_move_cards(
    bulk_data: BulkCardMove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """批量移动卡片"""
    try:
        moved_count = kanban_service.bulk_move_cards(db, current_user.id, bulk_data)
        return {"message": f"已移动 {moved_count} 张卡片"}
    except Exception as e:
        logger.error(f"Failed to bulk move cards: {str(e)}")
        raise HTTPException(status_code=500, detail="批量移动卡片失败")

# ===== 搜索和过滤端点 =====

@router.post("/cards/search", response_model=SearchResponse)
async def search_cards(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """搜索卡片"""
    try:
        results = kanban_service.search_cards(db, current_user.id, search_request)
        return results
    except Exception as e:
        logger.error(f"Failed to search cards: {str(e)}")
        raise HTTPException(status_code=500, detail="搜索卡片失败")

@router.post("/cards/filter", response_model=List[CardResponse])
async def filter_cards(
    filter_data: CardFilter,
    board_id: Optional[str] = Query(None, description="限定看板范围"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    kanban_service: KanbanService = Depends()
):
    """过滤卡片"""
    try:
        cards = kanban_service.filter_cards(db, current_user.id, filter_data, board_id)
        return cards
    except Exception as e:
        logger.error(f"Failed to filter cards: {str(e)}")
        raise HTTPException(status_code=500, detail="过滤卡片失败")