/**
 * 记事本数据库模型
 * 定义笔记和Todo的数据结构
 */

from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
import uuid

# 笔记标签关联表
note_tags = Table(
    'note_tags',
    Base.metadata,
    Column('note_id', String, ForeignKey('notes.id'), primary_key=True),
    Column('tag_id', String, ForeignKey('tags.id'), primary_key=True)
)

class Tag(Base):
    """标签模型"""
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), default="#6B7280")  # 十六进制颜色码
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关联
    notes = relationship("Note", secondary=note_tags, back_populates="tags")

class Note(Base):
    """笔记模型"""
    __tablename__ = "notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False, index=True)
    content = Column(Text, default="")
    is_bookmarked = Column(Boolean, default=False, index=True)
    word_count = Column(Integer, default=0)
    reading_time = Column(Integer, default=0)  # 预计阅读时间（分钟）

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 用户关联（如果有多用户支持）
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    # 关联
    tags = relationship("Tag", secondary=note_tags, back_populates="notes")
    todos = relationship("Todo", back_populates="note", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Note(id='{self.id}', title='{self.title}')>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "is_bookmarked": self.is_bookmarked,
            "tags": [tag.name for tag in self.tags],
            "word_count": self.word_count,
            "reading_time": self.reading_time,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def calculate_stats(self):
        """计算字数和阅读时间"""
        if self.content:
            # 计算字数（按空格分割）
            self.word_count = len(self.content.split())
            # 假设阅读速度为200字/分钟
            self.reading_time = max(1, (self.word_count + 199) // 200)
        else:
            self.word_count = 0
            self.reading_time = 0

class Todo(Base):
    """Todo事项模型"""
    __tablename__ = "todos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(String(500), nullable=False)
    is_completed = Column(Boolean, default=False, index=True)
    priority = Column(String(10), default="medium")  # low, medium, high

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # 关联
    note_id = Column(String, ForeignKey("notes.id"), nullable=False, index=True)
    note = relationship("Note", back_populates="todos")

    def __repr__(self):
        return f"<Todo(id='{self.id}', content='{self.content[:50]}', completed={self.is_completed})>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "content": self.content,
            "is_completed": self.is_completed,
            "priority": self.priority,
            "note_id": self.note_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

    def toggle_completion(self):
        """切换完成状态"""
        self.is_completed = not self.is_completed
        if self.is_completed:
            self.completed_at = func.now()
        else:
            self.completed_at = None

class NoteVersion(Base):
    """笔记版本历史模型"""
    __tablename__ = "note_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    note_id = Column(String, ForeignKey("notes.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, default="")
    version = Column(Integer, nullable=False)

    # 元数据
    change_summary = Column(String(500), default="")
    created_by = Column(String, nullable=True)  # 用户ID或系统标识

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "note_id": self.note_id,
            "title": self.title,
            "content": self.content,
            "version": self.version,
            "change_summary": self.change_summary,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }