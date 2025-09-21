/**
 * 笔记服务
 * 提供笔记相关的业务逻辑
 */

import logging
from sqlalchemy.orm import Session
from typing import Optional, List

from models.note import Note, NoteVersion, Todo

logger = logging.getLogger(__name__)

class NoteService:
    """笔记服务类"""

    def get_next_version_number(self, db: Session, note_id: str) -> int:
        """获取下一个版本号"""
        try:
            latest_version = db.query(NoteVersion).filter(
                NoteVersion.note_id == note_id
            ).order_by(NoteVersion.version.desc()).first()

            if latest_version:
                return latest_version.version + 1
            else:
                return 1
        except Exception as e:
            logger.error(f"获取版本号失败: {str(e)}")
            return 1

    def calculate_note_stats(self, note: Note) -> dict:
        """计算笔记统计信息"""
        try:
            content = note.content or ""

            # 计算字数
            word_count = len(content.split())

            # 计算阅读时间（假设200字/分钟）
            reading_time = max(1, (word_count + 199) // 200)

            # 计算代码行数（如果有代码块）
            code_lines = content.count('```') // 2  # 代码块数量

            # 计算标签数量
            tag_count = len(note.tags)

            # 计算Todo完成率
            todos = note.todos
            total_todos = len(todos)
            completed_todos = len([t for t in todos if t.is_completed])
            completion_rate = (completed_todos / total_todos * 100) if total_todos > 0 else 0

            return {
                "word_count": word_count,
                "reading_time": reading_time,
                "code_lines": code_lines,
                "tag_count": tag_count,
                "total_todos": total_todos,
                "completed_todos": completed_todos,
                "completion_rate": completion_rate
            }

        except Exception as e:
            logger.error(f"计算笔记统计失败: {str(e)}")
            return {
                "word_count": 0,
                "reading_time": 0,
                "code_lines": 0,
                "tag_count": 0,
                "total_todos": 0,
                "completed_todos": 0,
                "completion_rate": 0
            }

    def search_notes(self, db: Session, query: str, limit: int = 50) -> List[Note]:
        """搜索笔记"""
        try:
            # 简单的文本搜索
            notes = db.query(Note).filter(
                Note.title.contains(query) | Note.content.contains(query)
            ).limit(limit).all()

            return notes

        except Exception as e:
            logger.error(f"搜索笔记失败: {str(e)}")
            return []

    def get_notes_by_tag(self, db: Session, tag_name: str) -> List[Note]:
        """根据标签获取笔记"""
        try:
            notes = db.query(Note).join(Note.tags).filter(
                Tag.name == tag_name
            ).all()

            return notes

        except Exception as e:
            logger.error(f"按标签获取笔记失败: {str(e)}")
            return []

    def get_bookmarked_notes(self, db: Session, limit: int = 100) -> List[Note]:
        """获取收藏的笔记"""
        try:
            notes = db.query(Note).filter(
                Note.is_bookmarked == True
            ).order_by(Note.updated_at.desc()).limit(limit).all()

            return notes

        except Exception as e:
            logger.error(f"获取收藏笔记失败: {str(e)}")
            return []

    def get_recent_notes(self, db: Session, days: int = 7, limit: int = 50) -> List[Note]:
        """获取最近更新的笔记"""
        try:
            from datetime import datetime, timedelta

            cutoff_date = datetime.utcnow() - timedelta(days=days)
            notes = db.query(Note).filter(
                Note.updated_at >= cutoff_date
            ).order_by(Note.updated_at.desc()).limit(limit).all()

            return notes

        except Exception as e:
            logger.error(f"获取最近笔记失败: {str(e)}")
            return []

    def create_note_version(self, db: Session, note_id: str, title: str, content: str,
                          change_summary: str = "", created_by: Optional[str] = None) -> NoteVersion:
        """创建笔记版本"""
        try:
            version = NoteVersion(
                note_id=note_id,
                title=title,
                content=content,
                version=self.get_next_version_number(db, note_id),
                change_summary=change_summary,
                created_by=created_by
            )

            db.add(version)
            db.commit()
            db.refresh(version)

            return version

        except Exception as e:
            logger.error(f"创建笔记版本失败: {str(e)}")
            db.rollback()
            raise

    def get_note_versions(self, db: Session, note_id: str, limit: int = 10) -> List[NoteVersion]:
        """获取笔记的版本历史"""
        try:
            versions = db.query(NoteVersion).filter(
                NoteVersion.note_id == note_id
            ).order_by(NoteVersion.version.desc()).limit(limit).all()

            return versions

        except Exception as e:
            logger.error(f"获取笔记版本失败: {str(e)}")
            return []

    def restore_note_version(self, db: Session, note_id: str, version_id: str) -> Note:
        """恢复到指定版本"""
        try:
            # 获取要恢复的版本
            version = db.query(NoteVersion).filter(
                NoteVersion.id == version_id,
                NoteVersion.note_id == note_id
            ).first()

            if not version:
                raise ValueError("版本不存在")

            # 获取当前笔记
            note = db.query(Note).filter(Note.id == note_id).first()
            if not note:
                raise ValueError("笔记不存在")

            # 创建当前版本的备份
            self.create_note_version(
                db=db,
                note_id=note_id,
                title=note.title,
                content=note.content,
                change_summary=f"恢复到版本 {version.version}"
            )

            # 恢复到指定版本
            note.title = version.title
            note.content = version.content
            note.calculate_stats()

            db.commit()
            db.refresh(note)

            return note

        except Exception as e:
            logger.error(f"恢复笔记版本失败: {str(e)}")
            db.rollback()
            raise

    def get_note_todos_stats(self, db: Session, note_id: str) -> dict:
        """获取笔记的Todo统计"""
        try:
            todos = db.query(Todo).filter(Todo.note_id == note_id).all()

            total = len(todos)
            completed = len([t for t in todos if t.is_completed])
            by_priority = {
                "high": len([t for t in todos if t.priority == "high"]),
                "medium": len([t for t in todos if t.priority == "medium"]),
                "low": len([t for t in todos if t.priority == "low"]),
            }

            return {
                "total": total,
                "completed": completed,
                "pending": total - completed,
                "completion_rate": (completed / total * 100) if total > 0 else 0,
                "by_priority": by_priority
            }

        except Exception as e:
            logger.error(f"获取Todo统计失败: {str(e)}")
            return {
                "total": 0,
                "completed": 0,
                "pending": 0,
                "completion_rate": 0,
                "by_priority": {"high": 0, "medium": 0, "low": 0}
            }

    def export_note_to_markdown(self, note: Note) -> str:
        """将笔记导出为Markdown格式"""
        try:
            lines = []

            # 标题
            lines.append(f"# {note.title}")
            lines.append("")

            # 元数据
            lines.append("---")
            lines.append(f"**创建时间**: {note.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append(f"**更新时间**: {note.updated_at.strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append(f"**字数**: {note.word_count}")
            lines.append(f"**预计阅读时间**: {note.reading_time} 分钟")
            if note.is_bookmarked:
                lines.append("**收藏**: ⭐")
            if note.tags:
                lines.append(f"**标签**: {', '.join([tag.name for tag in note.tags])}")
            lines.append("---")
            lines.append("")

            # 内容
            lines.append(note.content)

            # Todo列表
            if note.todos:
                lines.append("")
                lines.append("## Todo事项")
                lines.append("")

                for todo in note.todos:
                    status = "✅" if todo.is_completed else "⬜"
                    priority_icon = {
                        "high": "🔴",
                        "medium": "🟡",
                        "low": "🟢"
                    }.get(todo.priority, "⚪")

                    lines.append(f"{status} {priority_icon} {todo.content}")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"导出Markdown失败: {str(e)}")
            return f"# {note.title}\n\n{note.content}"

# 创建服务实例
note_service = NoteService()