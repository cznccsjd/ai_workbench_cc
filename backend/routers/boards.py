#
# 项目管理看板RESTful API
# 提供看板、列表、卡片的标准RESTful操作
#

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime
import logging

from database.base import get_db
from models import user as user_model
from models.kanban import Board, List, Card
from schemas.kanban import (
    BoardCreate, BoardUpdate, BoardResponse,
    ListCreate, ListUpdate, ListResponse,
    CardCreate, CardUpdate, CardResponse, CardMoveRequest, CardReorderRequest
)
from services.auth_service import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["boards"])

# ===== 看板管理API =====

@router.get("", response_model=list[BoardResponse])
async def get_boards(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="返回数量限制"),
    include_archived: bool = Query(False, description="是否包含已归档看板"),
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有看板"""
    try:
        query = db.query(Board).filter(Board.user_id == current_user.id)

        if not include_archived:
            query = query.filter(Board.is_archived == False)

        query = query.order_by(Board.position, Board.created_at.desc())

        total_boards = query.count()
        boards = query.offset(skip).limit(limit).all()

        logger.info(f"用户 {current_user.id} 获取看板列表: 共 {total_boards} 个，返回 {len(boards)} 个")

        return [board.to_dict() for board in boards]

    except Exception as e:
        logger.error(f"获取用户 {current_user.id} 看板列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取看板列表失败"
        )

@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    board_data: BoardCreate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新看板"""
    try:
        # 计算新看板的位置
        max_position = db.query(func.max(Board.position)).filter(
            Board.user_id == current_user.id
        ).scalar() or -1

        board = Board(
            user_id=current_user.id,
            name=board_data.name,
            description=board_data.description,
            background_color=board_data.background_color,
            background_image=board_data.background_image,
            position=max_position + 1
        )

        db.add(board)
        db.commit()
        db.refresh(board)

        logger.info(f"用户 {current_user.id} 创建看板: {board.name} (ID: {board.id})")

        return board.to_dict()

    except Exception as e:
        db.rollback()
        logger.error(f"创建看板失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建看板失败"
        )

@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: str,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取看板详情（包含所有列表和卡片）"""
    try:
        board = db.query(Board).filter(
            and_(Board.id == board_id, Board.user_id == current_user.id, Board.is_archived == False)
        ).first()

        if not board:
            logger.warning(f"用户 {current_user.id} 尝试访问不存在的看板: {board_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="看板不存在"
            )

        logger.info(f"用户 {current_user.id} 获取看板详情: {board.name} (ID: {board_id})")

        return board.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取看板详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取看板详情失败"
        )

@router.put("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: str,
    board_data: BoardUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新看板信息"""
    try:
        board = db.query(Board).filter(
            and_(Board.id == board_id, Board.user_id == current_user.id)
        ).first()

        if not board:
            logger.warning(f"用户 {current_user.id} 尝试更新不存在的看板: {board_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="看板不存在或无权限"
            )

        # 更新字段
        update_data = board_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(board, field, value)

        board.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(board)

        logger.info(f"用户 {current_user.id} 更新看板: {board.name} (ID: {board_id})")

        return board.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新看板失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新看板失败"
        )

@router.delete("/{board_id}")
async def delete_board(
    board_id: str,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除看板（软删除）"""
    try:
        board = db.query(Board).filter(
            and_(Board.id == board_id, Board.user_id == current_user.id)
        ).first()

        if not board:
            logger.warning(f"用户 {current_user.id} 尝试删除不存在的看板: {board_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="看板不存在或无权限"
            )

        # 软删除：标记为已归档
        board.is_archived = True
        board.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"用户 {current_user.id} 删除看板: {board.name} (ID: {board_id})")

        return {"message": "看板已删除"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"删除看板失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除看板失败"
        )

@router.put("/{board_id}/archive")
async def archive_board(
    board_id: str,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """归档/取消归档看板"""
    try:
        board = db.query(Board).filter(
            and_(Board.id == board_id, Board.user_id == current_user.id)
        ).first()

        if not board:
            logger.warning(f"用户 {current_user.id} 尝试归档不存在的看板: {board_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="看板不存在"
            )

        # 切换归档状态
        board.is_archived = not board.is_archived
        board.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(board)

        action = "归档" if board.is_archived else "取消归档"
        logger.info(f"用户 {current_user.id} {action}看板: {board.name} (ID: {board_id})")

        return board.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"归档看板失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="归档看板失败"
        )

# ===== 列表管理API =====

@router.get("/{board_id}/lists", response_model=list[ListResponse])
async def get_board_lists(
    board_id: str,
    include_archived: bool = Query(False, description="是否包含已归档列表"),
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取看板的所有列表"""
    try:
        # 验证看板权限
        board = db.query(Board).filter(
            and_(Board.id == board_id, Board.user_id == current_user.id)
        ).first()

        if not board:
            logger.warning(f"用户 {current_user.id} 尝试访问不存在的看板列表: {board_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="看板不存在"
            )

        query = db.query(List).filter(List.board_id == board_id)

        if not include_archived:
            query = query.filter(List.is_archived == False)

        lists = query.order_by(List.position, List.created_at).all()

        logger.info(f"用户 {current_user.id} 获取看板 {board_id} 的列表: 共 {len(lists)} 个")

        return [lst.to_dict() for lst in lists]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取看板列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取看板列表失败"
        )

@router.post("/{board_id}/lists", response_model=ListResponse, status_code=status.HTTP_201_CREATED)
async def create_list(
    board_id: str,
    list_data: ListCreate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """在看板中创建新列表"""
    try:
        # 验证看板权限
        board = db.query(Board).filter(
            and_(Board.id == board_id, Board.user_id == current_user.id)
        ).first()

        if not board:
            logger.warning(f"用户 {current_user.id} 尝试在不存在的看板中创建列表: {board_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="看板不存在"
            )

        # 计算新列表的位置
        max_position = db.query(func.max(List.position)).filter(
            List.board_id == board_id
        ).scalar() or -1

        lst = List(
            board_id=board_id,
            name=list_data.name,
            description=list_data.description,
            position=max_position + 1
        )

        db.add(lst)
        db.commit()
        db.refresh(lst)

        logger.info(f"用户 {current_user.id} 在看板 {board.name} 中创建列表: {lst.name} (ID: {lst.id})")

        return lst.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"创建列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建列表失败"
        )

@router.put("/lists/{list_id}", response_model=ListResponse)
async def update_list(
    list_id: str,
    list_data: ListUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新列表信息"""
    try:
        lst = db.query(List).join(Board).filter(
            and_(List.id == list_id, Board.user_id == current_user.id)
        ).first()

        if not lst:
            logger.warning(f"用户 {current_user.id} 尝试更新不存在的列表: {list_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="列表不存在或无权限"
            )

        # 更新字段
        update_data = list_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lst, field, value)

        lst.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(lst)

        logger.info(f"用户 {current_user.id} 更新列表: {lst.name} (ID: {list_id})")

        return lst.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新列表失败"
        )

@router.delete("/lists/{list_id}")
async def delete_list(
    list_id: str,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除列表"""
    try:
        lst = db.query(List).join(Board).filter(
            and_(List.id == list_id, Board.user_id == current_user.id)
        ).first()

        if not lst:
            logger.warning(f"用户 {current_user.id} 尝试删除不存在的列表: {list_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="列表不存在或无权限"
            )

        # 软删除：标记为已归档
        lst.is_archived = True
        lst.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"用户 {current_user.id} 删除列表: {lst.name} (ID: {list_id})")

        return {"message": "列表已删除"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"删除列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除列表失败"
        )

@router.put("/lists/{list_id}/reorder")
async def reorder_list(
    list_id: str,
    reorder_data: dict,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """重新排序列表"""
    try:
        # 验证列表权限
        lst = db.query(List).join(Board).filter(
            and_(List.id == list_id, Board.user_id == current_user.id)
        ).first()

        if not lst:
            logger.warning(f"用户 {current_user.id} 尝试重新排序不存在的列表: {list_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="列表不存在或无权限"
            )

        new_position = reorder_data.get("new_position")
        if new_position is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少新位置参数"
            )

        # 获取同一看板中的所有列表
        lists = db.query(List).filter(
            and_(List.board_id == lst.board_id, List.is_archived == False)
        ).order_by(List.position).all()

        # 重新排序
        if new_position < 0 or new_position >= len(lists):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的位置"
            )

        # 移除当前列表
        current_lists = [l for l in lists if l.id != list_id]
        # 插入到新位置
        current_lists.insert(new_position, lst)

        # 更新所有列表的位置
        for index, item in enumerate(current_lists):
            item.position = index

        db.commit()

        logger.info(f"用户 {current_user.id} 重新排序列表: {lst.name} 到新位置 {new_position}")

        return {"message": "列表顺序已更新"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"重新排序列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="重新排序列表失败"
        )

# ===== 卡片管理API =====

@router.get("/lists/{list_id}/cards", response_model=list[CardResponse])
async def get_list_cards(
    list_id: str,
    include_archived: bool = Query(False, description="是否包含已归档卡片"),
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取列表的所有卡片"""
    try:
        # 验证列表权限
        lst = db.query(List).join(Board).filter(
            and_(List.id == list_id, Board.user_id == current_user.id)
        ).first()

        if not lst:
            logger.warning(f"用户 {current_user.id} 尝试访问不存在的列表卡片: {list_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="列表不存在"
            )

        query = db.query(Card).filter(Card.list_id == list_id)

        if not include_archived:
            query = query.filter(Card.is_archived == False)

        cards = query.order_by(Card.position, Card.created_at).all()

        logger.info(f"用户 {current_user.id} 获取列表 {lst.name} 的卡片: 共 {len(cards)} 个")

        return [card.to_dict() for card in cards]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取列表卡片失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取列表卡片失败"
        )

@router.post("/lists/{list_id}/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
    list_id: str,
    card_data: CardCreate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """在列表中创建新卡片"""
    try:
        # 验证列表权限
        lst = db.query(List).join(Board).filter(
            and_(List.id == list_id, Board.user_id == current_user.id)
        ).first()

        if not lst:
            logger.warning(f"用户 {current_user.id} 尝试在不存在的列表中创建卡片: {list_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="列表不存在"
            )

        # 计算新卡片的位置
        max_position = db.query(func.max(Card.position)).filter(
            Card.list_id == list_id
        ).scalar() or -1

        card = Card(
            list_id=list_id,
            title=card_data.title,
            description=card_data.description,
            position=max_position + 1,
            due_date=card_data.due_date,
            priority=card_data.priority.value,
            color=card_data.color
        )

        # 设置标签
        if card_data.tags:
            card.set_tags(card_data.tags)

        db.add(card)
        db.commit()
        db.refresh(card)

        logger.info(f"用户 {current_user.id} 在列表 {lst.name} 中创建卡片: {card.title} (ID: {card.id})")

        return card.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"创建卡片失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建卡片失败"
        )

@router.put("/cards/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: str,
    card_data: CardUpdate,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新卡片信息"""
    try:
        card = db.query(Card).join(List).join(Board).filter(
            and_(Card.id == card_id, Board.user_id == current_user.id)
        ).first()

        if not card:
            logger.warning(f"用户 {current_user.id} 尝试更新不存在的卡片: {card_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="卡片不存在或无权限"
            )

        # 更新字段
        update_data = card_data.dict(exclude_unset=True)

        # 特殊处理标签字段
        if "tags" in update_data:
            tags = update_data.pop("tags")
            if tags is not None:
                card.set_tags(tags)

        # 特殊处理优先级枚举
        if "priority" in update_data and update_data["priority"] is not None:
            update_data["priority"] = update_data["priority"].value

        # 更新其他字段
        for field, value in update_data.items():
            if value is not None:
                setattr(card, field, value)

        # 如果标记为已完成，设置完成时间
        if "is_completed" in update_data and update_data["is_completed"]:
            card.completed_at = datetime.utcnow()
        elif "is_completed" in update_data and not update_data["is_completed"]:
            card.completed_at = None

        card.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(card)

        logger.info(f"用户 {current_user.id} 更新卡片: {card.title} (ID: {card_id})")

        return card.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新卡片失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新卡片失败"
        )

@router.delete("/cards/{card_id}")
async def delete_card(
    card_id: str,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除卡片"""
    try:
        card = db.query(Card).join(List).join(Board).filter(
            and_(Card.id == card_id, Board.user_id == current_user.id)
        ).first()

        if not card:
            logger.warning(f"用户 {current_user.id} 尝试删除不存在的卡片: {card_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="卡片不存在或无权限"
            )

        # 软删除：标记为已归档
        card.is_archived = True
        card.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"用户 {current_user.id} 删除卡片: {card.title} (ID: {card_id})")

        return {"message": "卡片已删除"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"删除卡片失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除卡片失败"
        )

@router.put("/cards/{card_id}/move", response_model=CardResponse)
async def move_card(
    card_id: str,
    move_data: CardMoveRequest,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """移动卡片到其他列表"""
    try:
        # 验证卡片权限
        card = db.query(Card).join(List).join(Board).filter(
            and_(Card.id == card_id, Board.user_id == current_user.id)
        ).first()

        if not card:
            logger.warning(f"用户 {current_user.id} 尝试移动不存在的卡片: {card_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="卡片不存在"
            )

        # 验证目标列表权限
        target_list = db.query(List).join(Board).filter(
            and_(List.id == move_data.target_list_id, Board.user_id == current_user.id)
        ).first()

        if not target_list:
            logger.warning(f"用户 {current_user.id} 尝试移动卡片到不存在的列表: {move_data.target_list_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="目标列表不存在"
            )

        # 如果移动到新列表，需要重新排序两个列表的卡片
        if card.list_id != move_data.target_list_id:
            # 从原列表中移除
            source_cards = db.query(Card).filter(
                and_(Card.list_id == card.list_id, Card.position > card.position)
            ).all()

            for source_card in source_cards:
                source_card.position -= 1

            # 添加到新列表的指定位置
            target_cards = db.query(Card).filter(
                and_(Card.list_id == move_data.target_list_id,
                     Card.position >= move_data.new_position)
            ).all()

            for target_card in target_cards:
                target_card.position += 1

            card.list_id = move_data.target_list_id

        card.position = move_data.new_position
        card.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(card)

        logger.info(f"用户 {current_user.id} 移动卡片: {card.title} 到新位置 {move_data.new_position}")

        return card.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"移动卡片失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="移动卡片失败"
        )

@router.put("/cards/{card_id}/reorder", response_model=CardResponse)
async def reorder_card(
    card_id: str,
    reorder_data: CardReorderRequest,
    current_user: user_model.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """重新排序卡片（在同一列表内）"""
    try:
        # 验证卡片权限
        card = db.query(Card).join(List).join(Board).filter(
            and_(Card.id == card_id, Board.user_id == current_user.id)
        ).first()

        if not card:
            logger.warning(f"用户 {current_user.id} 尝试重新排序不存在的卡片: {card_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="卡片不存在"
            )

        new_position = reorder_data.new_position
        if new_position < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的位置"
            )

        # 获取同一列表中的所有卡片
        cards = db.query(Card).filter(
            and_(Card.list_id == card.list_id, Card.is_archived == False)
        ).order_by(Card.position).all()

        if new_position >= len(cards):
            new_position = len(cards) - 1

        # 重新排序
        current_cards = [c for c in cards if c.id != card_id]
        current_cards.insert(new_position, card)

        # 更新所有卡片的位置
        for index, item in enumerate(current_cards):
            item.position = index

        db.commit()
        db.refresh(card)

        logger.info(f"用户 {current_user.id} 重新排序卡片: {card.title} 到新位置 {new_position}")

        return card.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"重新排序卡片失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="重新排序卡片失败"
        )