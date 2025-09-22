#
# 项目管理看板服务层
# 处理看板、列表、卡片的业务逻辑
#

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import logging

from models.kanban import Board, List, Card
from models.user import User
from schemas.kanban import (
    BoardCreate, BoardUpdate, BoardStats,
    ListCreate, ListUpdate,
    CardCreate, CardUpdate, CardMoveRequest,
    BulkCardUpdate, BulkCardMove, CardFilter, SearchRequest, SearchResponse
)

logger = logging.getLogger(__name__)

class KanbanService:
    """看板服务类"""

    def __init__(self):
        pass

    # ===== 看板相关方法 =====

    def get_user_boards(self, db: Session, user_id: str, skip: int = 0, limit: int = 20, include_archived: bool = False) -> List[Board]:
        """获取用户的所有看板"""
        try:
            query = db.query(Board).filter(Board.user_id == user_id)

            if not include_archived:
                query = query.filter(Board.is_archived == False)

            return query.order_by(Board.position, Board.created_at.desc()).offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Failed to get user boards: {str(e)}")
            raise

    def create_board(self, db: Session, user_id: str, board_data: BoardCreate) -> Board:
        """创建新看板"""
        try:
            # 计算新看板的位置
            max_position = db.query(func.max(Board.position)).filter(Board.user_id == user_id).scalar() or 0

            board = Board(
                user_id=user_id,
                name=board_data.name,
                description=board_data.description,
                background_color=board_data.background_color or "#FFFFFF",
                background_image=board_data.background_image,
                position=max_position + 1
            )

            db.add(board)
            db.commit()
            db.refresh(board)

            logger.info(f"Board created: {board.id} for user {user_id}")
            return board

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create board: {str(e)}")
            raise

    def get_board_with_lists_and_cards(self, db: Session, board_id: str, user_id: str) -> Optional[Board]:
        """获取看板详情包含所有列表和卡片"""
        try:
            board = db.query(Board).filter(
                and_(Board.id == board_id, Board.user_id == user_id)
            ).first()

            if not board:
                return None

            # 预加载列表和卡片数据
            board.lists = db.query(List).filter(
                and_(List.board_id == board_id, List.is_archived == False)
            ).order_by(List.position).all()

            for lst in board.lists:
                lst.cards = db.query(Card).filter(
                    and_(Card.list_id == lst.id, Card.is_archived == False)
                ).order_by(Card.position).all()

            return board

        except Exception as e:
            logger.error(f"Failed to get board with details: {str(e)}")
            raise

    def update_board(self, db: Session, board_id: str, user_id: str, board_data: BoardUpdate) -> Optional[Board]:
        """更新看板信息"""
        try:
            board = db.query(Board).filter(
                and_(Board.id == board_id, Board.user_id == user_id)
            ).first()

            if not board:
                return None

            # 更新字段
            update_data = board_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(board, field, value)

            board.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(board)

            logger.info(f"Board updated: {board_id}")
            return board

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update board: {str(e)}")
            raise

    def delete_board(self, db: Session, board_id: str, user_id: str) -> bool:
        """删除看板（软删除）"""
        try:
            board = db.query(Board).filter(
                and_(Board.id == board_id, Board.user_id == user_id)
            ).first()

            if not board:
                return False

            # 软删除：标记为已归档
            board.is_archived = True
            board.updated_at = datetime.utcnow()

            # 同时归档所有列表和卡片
            lists = db.query(List).filter(List.board_id == board_id).all()
            for lst in lists:
                lst.is_archived = True
                # 归档列表下的所有卡片
                db.query(Card).filter(Card.list_id == lst.id).update({"is_archived": True})

            db.commit()
            logger.info(f"Board deleted (archived): {board_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete board: {str(e)}")
            raise

    def get_board_stats(self, db: Session, board_id: str, user_id: str) -> Optional[BoardStats]:
        """获取看板统计信息"""
        try:
            # 验证看板权限
            board = db.query(Board).filter(
                and_(Board.id == board_id, Board.user_id == user_id)
            ).first()

            if not board:
                return None

            # 获取看板下所有列表ID
            list_ids = db.query(List.id).filter(
                and_(List.board_id == board_id, List.is_archived == False)
            ).subquery()

            # 统计卡片总数
            total_cards = db.query(Card).filter(
                Card.list_id.in_(list_ids)
            ).count()

            # 统计已完成卡片
            completed_cards = db.query(Card).filter(
                and_(Card.list_id.in_(list_ids), Card.is_completed == True)
            ).count()

            # 统计过期卡片
            now = datetime.utcnow()
            overdue_cards = db.query(Card).filter(
                and_(
                    Card.list_id.in_(list_ids),
                    Card.is_completed == False,
                    Card.due_date.isnot(None),
                    Card.due_date < now
                )
            ).count()

            # 按优先级统计
            cards_by_priority = {}
            for priority in ["low", "medium", "high", "urgent"]:
                count = db.query(Card).filter(
                    and_(Card.list_id.in_(list_ids), Card.priority == priority)
                ).count()
                cards_by_priority[priority] = count

            # 按列表统计
            cards_by_list = {}
            for lst in board.lists:
                if not lst.is_archived:
                    count = db.query(Card).filter(Card.list_id == lst.id).count()
                    cards_by_list[lst.name] = count

            return BoardStats(
                total_cards=total_cards,
                completed_cards=completed_cards,
                overdue_cards=overdue_cards,
                cards_by_priority=cards_by_priority,
                cards_by_list=cards_by_list
            )

        except Exception as e:
            logger.error(f"Failed to get board stats: {str(e)}")
            raise

    # ===== 列表相关方法 =====

    def create_list(self, db: Session, user_id: str, list_data: ListCreate) -> List:
        """创建新列表"""
        try:
            # 验证看板权限
            board = db.query(Board).filter(
                and_(Board.id == list_data.board_id, Board.user_id == user_id)
            ).first()

            if not board:
                raise ValueError("看板不存在或无权限")

            # 计算新列表的位置
            max_position = db.query(func.max(List.position)).filter(List.board_id == list_data.board_id).scalar() or 0

            lst = List(
                board_id=list_data.board_id,
                name=list_data.name,
                description=list_data.description,
                position=list_data.position if list_data.position is not None else max_position + 1
            )

            db.add(lst)
            db.commit()
            db.refresh(lst)

            logger.info(f"List created: {lst.id} for board {list_data.board_id}")
            return lst

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create list: {str(e)}")
            raise

    def update_list(self, db: Session, list_id: str, user_id: str, list_data: ListUpdate) -> Optional[List]:
        """更新列表信息"""
        try:
            lst = db.query(List).join(Board).filter(
                and_(List.id == list_id, Board.user_id == user_id)
            ).first()

            if not lst:
                return None

            # 更新字段
            update_data = list_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(lst, field, value)

            lst.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(lst)

            logger.info(f"List updated: {list_id}")
            return lst

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update list: {str(e)}")
            raise

    def delete_list(self, db: Session, list_id: str, user_id: str) -> bool:
        """删除列表"""
        try:
            lst = db.query(List).join(Board).filter(
                and_(List.id == list_id, Board.user_id == user_id)
            ).first()

            if not lst:
                return False

            # 软删除：标记为已归档
            lst.is_archived = True
            lst.updated_at = datetime.utcnow()

            # 同时归档列表下的所有卡片
            db.query(Card).filter(Card.list_id == list_id).update({"is_archived": True})

            db.commit()
            logger.info(f"List deleted (archived): {list_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete list: {str(e)}")
            raise

    # ===== 卡片相关方法 =====

    def create_card(self, db: Session, user_id: str, card_data: CardCreate) -> Card:
        """创建新卡片"""
        try:
            # 验证列表权限（通过看板验证）
            lst = db.query(List).join(Board).filter(
                and_(List.id == card_data.list_id, Board.user_id == user_id)
            ).first()

            if not lst:
                raise ValueError("列表不存在或无权限")

            # 计算新卡片的位置
            max_position = db.query(func.max(Card.position)).filter(Card.list_id == card_data.list_id).scalar() or 0

            card = Card(
                list_id=card_data.list_id,
                title=card_data.title,
                description=card_data.description,
                position=card_data.position if card_data.position is not None else max_position + 1,
                due_date=card_data.due_date,
                priority=card_data.priority or "medium",
                color=card_data.color
            )

            if card_data.tags:
                card.set_tags(card_data.tags)

            db.add(card)
            db.commit()
            db.refresh(card)

            logger.info(f"Card created: {card.id} for list {card_data.list_id}")
            return card

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create card: {str(e)}")
            raise

    def get_card(self, db: Session, card_id: str, user_id: str) -> Optional[Card]:
        """获取卡片详情"""
        try:
            card = db.query(Card).join(List).join(Board).filter(
                and_(Card.id == card_id, Board.user_id == user_id)
            ).first()

            return card

        except Exception as e:
            logger.error(f"Failed to get card: {str(e)}")
            raise

    def update_card(self, db: Session, card_id: str, user_id: str, card_data: CardUpdate) -> Optional[Card]:
        """更新卡片信息"""
        try:
            card = db.query(Card).join(List).join(Board).filter(
                and_(Card.id == card_id, Board.user_id == user_id)
            ).first()

            if not card:
                return None

            # 更新字段
            update_data = card_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                if field == "tags" and value is not None:
                    card.set_tags(value)
                else:
                    setattr(card, field, value)

            # 如果标记为已完成，设置完成时间
            if "is_completed" in update_data and update_data["is_completed"]:
                card.completed_at = datetime.utcnow()

            card.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(card)

            logger.info(f"Card updated: {card_id}")
            return card

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update card: {str(e)}")
            raise

    def delete_card(self, db: Session, card_id: str, user_id: str) -> bool:
        """删除卡片"""
        try:
            card = db.query(Card).join(List).join(Board).filter(
                and_(Card.id == card_id, Board.user_id == user_id)
            ).first()

            if not card:
                return False

            # 软删除：标记为已归档
            card.is_archived = True
            card.updated_at = datetime.utcnow()

            db.commit()
            logger.info(f"Card deleted (archived): {card_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete card: {str(e)}")
            raise

    def move_card(self, db: Session, user_id: str, move_data: CardMoveRequest) -> Optional[Card]:
        """移动卡片"""
        try:
            # 验证权限
            source_card = db.query(Card).join(List).join(Board).filter(
                and_(Card.id.in_(
                    db.query(Card.id).filter(Card.list_id == move_data.source_list_id)
                ), Board.user_id == user_id)
            ).first()

            if not source_card:
                return None

            # 验证目标列表权限
            target_list = db.query(List).join(Board).filter(
                and_(List.id == move_data.target_list_id, Board.user_id == user_id)
            ).first()

            if not target_list:
                return None

            # 获取要移动的卡片
            card = db.query(Card).filter(Card.list_id == move_data.source_list_id).order_by(Card.position).offset(
                move_data.new_position
            ).first()

            if not card:
                return None

            # 更新卡片列表ID
            old_list_id = card.list_id
            card.list_id = move_data.target_list_id
            card.position = move_data.new_position
            card.updated_at = datetime.utcnow()

            # 重新排序源列表中的卡片
            self._reorder_cards(db, old_list_id)

            # 重新排序目标列表中的卡片
            self._reorder_cards(db, move_data.target_list_id)

            db.commit()
            db.refresh(card)

            logger.info(f"Card moved: {card.id} from {old_list_id} to {move_data.target_list_id}")
            return card

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to move card: {str(e)}")
            raise

    def _reorder_cards(self, db: Session, list_id: str):
        """重新排序列表中的卡片位置"""
        cards = db.query(Card).filter(
            and_(Card.list_id == list_id, Card.is_archived == False)
        ).order_by(Card.position).all()

        for index, card in enumerate(cards):
            card.position = index

    def bulk_update_cards(self, db: Session, user_id: str, bulk_data: BulkCardUpdate) -> int:
        """批量更新卡片"""
        try:
            # 验证权限和卡片存在性
            cards = db.query(Card).join(List).join(Board).filter(
                and_(Card.id.in_(bulk_data.card_ids), Board.user_id == user_id)
            ).all()

            if len(cards) != len(bulk_data.card_ids):
                raise ValueError("部分卡片不存在或无权限")

            update_data = bulk_data.updates.dict(exclude_unset=True)
            updated_count = 0

            for card in cards:
                for field, value in update_data.items():
                    if field == "tags" and value is not None:
                        card.set_tags(value)
                    else:
                        setattr(card, field, value)

                card.updated_at = datetime.utcnow()
                updated_count += 1

            db.commit()
            logger.info(f"Bulk updated {updated_count} cards for user {user_id}")
            return updated_count

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to bulk update cards: {str(e)}")
            raise

    def bulk_move_cards(self, db: Session, user_id: str, bulk_data: BulkCardMove) -> int:
        """批量移动卡片"""
        try:
            # 验证目标列表权限
            target_list = db.query(List).join(Board).filter(
                and_(List.id == bulk_data.target_list_id, Board.user_id == user_id)
            ).first()

            if not target_list:
                raise ValueError("目标列表不存在或无权限")

            # 验证卡片权限
            cards = db.query(Card).join(List).join(Board).filter(
                and_(Card.id.in_(bulk_data.card_ids), Board.user_id == user_id)
            ).all()

            if len(cards) != len(bulk_data.card_ids):
                raise ValueError("部分卡片不存在或无权限")

            moved_count = 0
            for card in cards:
                old_list_id = card.list_id
                card.list_id = bulk_data.target_list_id
                card.updated_at = datetime.utcnow()
                moved_count += 1

                # 重新排序相关列表
                self._reorder_cards(db, old_list_id)

            # 重新排序目标列表
            self._reorder_cards(db, bulk_data.target_list_id)

            db.commit()
            logger.info(f"Bulk moved {moved_count} cards to list {bulk_data.target_list_id}")
            return moved_count

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to bulk move cards: {str(e)}")
            raise

    def search_cards(self, db: Session, user_id: str, search_request: SearchRequest) -> SearchResponse:
        """搜索卡片"""
        try:
            query = db.query(Card).join(List).join(Board).filter(Board.user_id == user_id)

            # 应用搜索条件
            if search_request.query:
                search_term = f"%{search_request.query}%"
                query = query.filter(
                    or_(
                        Card.title.ilike(search_term),
                        Card.description.ilike(search_term)
                    )
                )

            # 限制看板范围
            if search_request.board_id:
                query = query.filter(List.board_id == search_request.board_id)

            # 是否包含已归档内容
            if not search_request.include_archived:
                query = query.filter(Card.is_archived == False)

            cards = query.order_by(Card.created_at.desc()).all()

            return SearchResponse(
                cards=cards,
                total_count=len(cards),
                query=search_request.query
            )

        except Exception as e:
            logger.error(f"Failed to search cards: {str(e)}")
            raise

    def filter_cards(self, db: Session, user_id: str, filter_data: CardFilter, board_id: Optional[str] = None) -> List[Card]:
        """过滤卡片"""
        try:
            query = db.query(Card).join(List).join(Board).filter(Board.user_id == user_id)

            # 限制看板范围
            if board_id:
                query = query.filter(List.board_id == board_id)
            elif filter_data.list_ids:
                query = query.filter(Card.list_id.in_(filter_data.list_ids))

            # 优先级过滤
            if filter_data.priorities:
                query = query.filter(Card.priority.in_(filter_data.priorities))

            # 完成状态过滤
            if filter_data.is_completed is not None:
                query = query.filter(Card.is_completed == filter_data.is_completed)

            # 截止日期过滤
            if filter_data.has_due_date is not None:
                if filter_data.has_due_date:
                    query = query.filter(Card.due_date.isnot(None))
                else:
                    query = query.filter(Card.due_date.is_(None))

            # 过期状态过滤
            if filter_data.is_overdue is not None:
                now = datetime.utcnow()
                if filter_data.is_overdue:
                    query = query.filter(
                        and_(Card.due_date.isnot(None), Card.due_date < now, Card.is_completed == False)
                    )
                else:
                    query = query.filter(
                        or_(Card.due_date.is_(None), Card.due_date >= now, Card.is_completed == True)
                    )

            # 标签过滤
            if filter_data.tags:
                for tag in filter_data.tags:
                    query = query.filter(Card.tags.contains(f'"{tag}"'))

            return query.order_by(Card.created_at.desc()).all()

        except Exception as e:
            logger.error(f"Failed to filter cards: {str(e)}")
            raise