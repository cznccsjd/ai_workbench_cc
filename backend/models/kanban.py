#
# 项目管理看板数据库模型
# Trello风格的三层次结构：Board -> List -> Card
#

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
import uuid

class Board(Base):
    """看板模型 - 最高层次的项目组织单位"""
    __tablename__ = "boards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    background_color = Column(String(7), default="#FFFFFF")  # 十六进制颜色
    background_image = Column(String(500), nullable=True)  # 背景图片URL
    is_archived = Column(Boolean, default=False, index=True)

    # 排序和位置
    position = Column(Integer, default=0, index=True)  # 在用户看板中的位置

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    user = relationship("User", back_populates="boards")
    lists = relationship("List", back_populates="board", cascade="all, delete-orphan", order_by="List.position")

    def __repr__(self):
        return f"<Board(id='{self.id}', name='{self.name}', user_id='{self.user_id}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "background_color": self.background_color,
            "background_image": self.background_image,
            "is_archived": self.is_archived,
            "position": self.position,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "lists": [lst.to_dict() for lst in self.lists] if self.lists else []
        }

class List(Base):
    """列表模型 - 看板中的列，如待办、进行中、已完成"""
    __tablename__ = "lists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    board_id = Column(String, ForeignKey("boards.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    position = Column(Integer, default=0, index=True)  # 在看板中的水平位置
    is_archived = Column(Boolean, default=False, index=True)

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan", order_by="Card.position")

    __table_args__ = (
        Index('idx_board_position', 'board_id', 'position'),
    )

    def __repr__(self):
        return f"<List(id='{self.id}', name='{self.name}', board_id='{self.board_id}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "board_id": self.board_id,
            "name": self.name,
            "description": self.description,
            "position": self.position,
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "cards": [card.to_dict() for card in self.cards] if self.cards else []
        }

class Card(Base):
    """卡片模型 - 列表中的任务卡片"""
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    list_id = Column(String, ForeignKey("lists.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)  # 详细描述，支持Markdown
    position = Column(Integer, default=0, index=True)  # 在列表中的垂直位置

    # 任务属性
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)  # 截止日期
    priority = Column(String(20), default="medium", index=True)  # low, medium, high, urgent
    is_completed = Column(Boolean, default=False, index=True)
    is_archived = Column(Boolean, default=False, index=True)

    # 元数据
    color = Column(String(7), nullable=True)  # 卡片颜色标记
    tags = Column(String(1000), nullable=True)  # JSON数组格式的标签

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # 关联
    list = relationship("List", back_populates="cards")

    __table_args__ = (
        Index('idx_list_position', 'list_id', 'position'),
        Index('idx_due_date', 'due_date'),
        Index('idx_priority', 'priority'),
    )

    def __repr__(self):
        return f"<Card(id='{self.id}', title='{self.title}', list_id='{self.list_id}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "list_id": self.list_id,
            "title": self.title,
            "description": self.description,
            "position": self.position,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "priority": self.priority,
            "is_completed": self.is_completed,
            "is_archived": self.is_archived,
            "color": self.color,
            "tags": self.get_tags(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

    def get_tags(self):
        """解析标签JSON"""
        import json
        try:
            if self.tags:
                return json.loads(self.tags)
            return []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_tags(self, tags_list):
        """设置标签JSON"""
        import json
        self.tags = json.dumps(tags_list) if tags_list else None