# 记事本相关路由
# 提供笔记的CRUD操作、AI整理、Todo提取等功能

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

from database import get_db
from models.note import Note, Todo, Tag, NoteVersion
from services.ai_service import AIService
from services.note_service import NoteService

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic模型
class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_bookmarked: Optional[bool] = None
    tags: Optional[List[str]] = None

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    is_bookmarked: bool
    tags: List[str]
    word_count: int
    reading_time: int
    created_at: datetime
    updated_at: datetime

class TodoCreate(BaseModel):
    content: str
    priority: Optional[str] = "medium"  # low, medium, high

class TodoResponse(BaseModel):
    id: str
    content: str
    is_completed: bool
    priority: str
    note_id: str
    created_at: datetime
    completed_at: Optional[datetime] = None

class OrganizedContentResponse(BaseModel):
    title: str
    content: str
    tags: List[str]
    summary: str

class TodoExtractionResponse(BaseModel):
    todos: List[TodoResponse]
    summary: str

# 服务实例
ai_service = AIService()
note_service = NoteService()

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    tags: Optional[str] = None,  # 逗号分隔的标签
    is_bookmarked: Optional[bool] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """获取笔记列表"""
    try:
        query = db.query(Note)

        # 搜索过滤
        if search:
            query = query.filter(
                Note.title.contains(search) | Note.content.contains(search)
            )

        # 标签过滤
        if tags:
            tag_list = tags.split(",")
            query = query.join(Note.tags).filter(Tag.name.in_(tag_list))

        # 收藏过滤
        if is_bookmarked is not None:
            query = query.filter(Note.is_bookmarked == is_bookmarked)

        # 排序
        if sort_by == "title":
            sort_field = Note.title
        elif sort_by == "created_at":
            sort_field = Note.created_at
        else:
            sort_field = Note.updated_at

        if sort_order == "asc":
            query = query.order_by(sort_field.asc())
        else:
            query = query.order_by(sort_field.desc())

        notes = query.offset(skip).limit(limit).all()

        # 转换为响应模型
        return [
            NoteResponse(
                id=note.id,
                title=note.title,
                content=note.content,
                is_bookmarked=note.is_bookmarked,
                tags=[tag.name for tag in note.tags],
                word_count=note.word_count,
                reading_time=note.reading_time,
                created_at=note.created_at,
                updated_at=note.updated_at,
            )
            for note in notes
        ]

    except Exception as e:
        logger.error(f"获取笔记列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取笔记列表失败"
        )

@router.post("/", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db)
):
    """创建新笔记"""
    try:
        note = Note(
            title=note_data.title,
            content=note_data.content or "",
        )
        note.calculate_stats()

        db.add(note)
        db.commit()
        db.refresh(note)

        logger.info(f"创建新笔记: {note.id}")

        return NoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            is_bookmarked=note.is_bookmarked,
            tags=[],
            word_count=note.word_count,
            reading_time=note.reading_time,
            created_at=note.created_at,
            updated_at=note.updated_at,
        )

    except Exception as e:
        logger.error(f"创建笔记失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建笔记失败"
        )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """获取单个笔记"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        return NoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            is_bookmarked=note.is_bookmarked,
            tags=[tag.name for tag in note.tags],
            word_count=note.word_count,
            reading_time=note.reading_time,
            created_at=note.created_at,
            updated_at=note.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取笔记失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取笔记失败"
        )

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    db: Session = Depends(get_db)
):
    """更新笔记"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        # 创建版本历史
        version = NoteVersion(
            note_id=note_id,
            title=note.title,
            content=note.content,
            version=note_service.get_next_version_number(db, note_id),
            change_summary=f"更新笔记: {note_data.title or note.title}"
        )
        db.add(version)

        # 更新笔记
        if note_data.title is not None:
            note.title = note_data.title
        if note_data.content is not None:
            note.content = note_data.content
        if note_data.is_bookmarked is not None:
            note.is_bookmarked = note_data.is_bookmarked

        # 重新计算统计信息
        note.calculate_stats()

        db.commit()
        db.refresh(note)

        logger.info(f"更新笔记: {note_id}")

        return NoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            is_bookmarked=note.is_bookmarked,
            tags=[tag.name for tag in note.tags],
            word_count=note.word_count,
            reading_time=note.reading_time,
            created_at=note.created_at,
            updated_at=note.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新笔记失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新笔记失败"
        )

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """删除笔记"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        db.delete(note)
        db.commit()

        logger.info(f"删除笔记: {note_id}")

        return {"message": "笔记删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除笔记失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除笔记失败"
        )

@router.post("/{note_id}/bookmark", response_model=NoteResponse)
async def toggle_bookmark(
    note_id: str,
    db: Session = Depends(get_db)
):
    """切换笔记收藏状态"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        note.is_bookmarked = not note.is_bookmarked
        db.commit()
        db.refresh(note)

        logger.info(f"切换收藏状态: {note_id} - {note.is_bookmarked}")

        return NoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            is_bookmarked=note.is_bookmarked,
            tags=[tag.name for tag in note.tags],
            word_count=note.word_count,
            reading_time=note.reading_time,
            created_at=note.created_at,
            updated_at=note.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"切换收藏状态失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="切换收藏状态失败"
        )

@router.post("/{note_id}/organize", response_model=OrganizedContentResponse)
async def organize_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """AI智能整理笔记"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        logger.info(f"开始AI整理笔记: {note_id}")

        # 调用AI服务进行整理
        organized_content = await ai_service.organize_note_content(
            note.title,
            note.content
        )

        # 创建版本历史
        version = NoteVersion(
            note_id=note_id,
            title=note.title,
            content=note.content,
            version=note_service.get_next_version_number(db, note_id),
            change_summary="AI智能整理"
        )
        db.add(version)

        # 更新笔记
        note.title = organized_content.title
        note.content = organized_content.content

        # 处理标签
        if organized_content.tags:
            # 清空现有标签
            note.tags.clear()

            # 添加新标签
            for tag_name in organized_content.tags:
                tag = db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.add(tag)
                note.tags.append(tag)

        note.calculate_stats()
        db.commit()
        db.refresh(note)

        logger.info(f"AI整理完成: {note_id}")

        return OrganizedContentResponse(
            title=organized_content.title,
            content=organized_content.content,
            tags=[tag.name for tag in note.tags],
            summary=organized_content.summary
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI整理失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI整理失败: {str(e)}"
        )

@router.post("/{note_id}/extract-todos", response_model=TodoExtractionResponse)
async def extract_todos(
    note_id: str,
    db: Session = Depends(get_db)
):
    """AI提取Todo事项"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        logger.info(f"开始AI提取Todo: {note_id}")

        # 调用AI服务提取Todo
        extraction_result = await ai_service.extract_todos_from_note(
            note.title,
            note.content
        )

        # 创建新的Todo事项
        created_todos = []
        for todo_data in extraction_result.todos:
            todo = Todo(
                note_id=note_id,
                content=todo_data.content,
                priority=todo_data.priority
            )
            db.add(todo)
            db.flush()  # 获取ID
            created_todos.append(todo)

        db.commit()

        logger.info(f"AI提取Todo完成: {note_id}，共提取 {len(created_todos)} 个Todo")

        return TodoExtractionResponse(
            todos=[
                TodoResponse(
                    id=todo.id,
                    content=todo.content,
                    is_completed=todo.is_completed,
                    priority=todo.priority,
                    note_id=todo.note_id,
                    created_at=todo.created_at,
                    completed_at=todo.completed_at,
                )
                for todo in created_todos
            ],
            summary=extraction_result.summary
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI提取Todo失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI提取Todo失败: {str(e)}"
        )

@router.get("/{note_id}/todos", response_model=List[TodoResponse])
async def get_note_todos(
    note_id: str,
    db: Session = Depends(get_db)
):
    """获取笔记的所有Todo事项"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        todos = db.query(Todo).filter(Todo.note_id == note_id).all()

        return [
            TodoResponse(
                id=todo.id,
                content=todo.content,
                is_completed=todo.is_completed,
                priority=todo.priority,
                note_id=todo.note_id,
                created_at=todo.created_at,
                completed_at=todo.completed_at,
            )
            for todo in todos
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取笔记Todo失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取笔记Todo失败"
        )

@router.post("/{note_id}/todos", response_model=TodoResponse)
async def create_todo(
    note_id: str,
    todo_data: TodoCreate,
    db: Session = Depends(get_db)
):
    """为笔记创建Todo事项"""
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="笔记不存在"
            )

        todo = Todo(
            note_id=note_id,
            content=todo_data.content,
            priority=todo_data.priority
        )

        db.add(todo)
        db.commit()
        db.refresh(todo)

        logger.info(f"创建Todo: {todo.id} for note {note_id}")

        return TodoResponse(
            id=todo.id,
            content=todo.content,
            is_completed=todo.is_completed,
            priority=todo.priority,
            note_id=todo.note_id,
            created_at=todo.created_at,
            completed_at=todo.completed_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建Todo失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建Todo失败"
        )

@router.post("/todos/{todo_id}/toggle", response_model=TodoResponse)
async def toggle_todo(
    todo_id: str,
    db: Session = Depends(get_db)
):
    """切换Todo完成状态"""
    try:
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo不存在"
            )

        todo.toggle_completion()
        db.commit()
        db.refresh(todo)

        logger.info(f"切换Todo状态: {todo_id} - {todo.is_completed}")

        return TodoResponse(
            id=todo.id,
            content=todo.content,
            is_completed=todo.is_completed,
            priority=todo.priority,
            note_id=todo.note_id,
            created_at=todo.created_at,
            completed_at=todo.completed_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"切换Todo状态失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="切换Todo状态失败"
        )

@router.delete("/todos/{todo_id}")
async def delete_todo(
    todo_id: str,
    db: Session = Depends(get_db)
):
    """删除Todo事项"""
    try:
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo不存在"
            )

        db.delete(todo)
        db.commit()

        logger.info(f"删除Todo: {todo_id}")

        return {"message": "Todo删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除Todo失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除Todo失败"
        )