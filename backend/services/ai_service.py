#
# AI服务
# 提供AI智能整理、Todo提取等功能
#

import logging
from typing import List, Optional
from pydantic import BaseModel
import httpx
import json
import asyncio

from config import settings

logger = logging.getLogger(__name__)

class OrganizedContent(BaseModel):
    """AI整理后的内容"""
    title: str
    content: str
    tags: List[str]
    summary: str

class ExtractedTodo(BaseModel):
    """提取的Todo事项"""
    content: str
    priority: str  # low, medium, high

class TodoExtractionResult(BaseModel):
    """Todo提取结果"""
    todos: List[ExtractedTodo]
    summary: str

class AIService:
    """AI服务类"""

    def __init__(self):
        self.kimi_api_key = settings.KIMI_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY
        self.timeout = 30.0

    async def _call_kimi_api(self, messages: List[dict], model: str = "moonshot-v1-8k") -> str:
        """调用Kimi API"""
        if not self.kimi_api_key:
            logger.warning("Kimi API密钥未配置，使用模拟数据")
            return await self._get_mock_response(messages)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    "https://api.moonshot.cn/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.kimi_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 2000
                    }
                )

                if response.status_code != 200:
                    logger.error(f"Kimi API调用失败: {response.status_code} - {response.text}")
                    return await self._get_mock_response(messages)

                result = response.json()
                return result["choices"][0]["message"]["content"]

        except Exception as e:
            logger.error(f"调用Kimi API异常: {str(e)}")
            return await self._get_mock_response(messages)

    async def _call_openai_api(self, messages: List[dict], model: str = "gpt-3.5-turbo") -> str:
        """调用OpenAI API"""
        if not self.openai_api_key:
            logger.warning("OpenAI API密钥未配置，使用模拟数据")
            return await self._get_mock_response(messages)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 2000
                    }
                )

                if response.status_code != 200:
                    logger.error(f"OpenAI API调用失败: {response.status_code} - {response.text}")
                    return await self._get_mock_response(messages)

                result = response.json()
                return result["choices"][0]["message"]["content"]

        except Exception as e:
            logger.error(f"调用OpenAI API异常: {str(e)}")
            return await self._get_mock_response(messages)

    async def _get_mock_response(self, messages: List[dict]) -> str:
        """获取模拟响应（用于测试或API不可用时）"""
        # 简单的模拟逻辑
        user_message = messages[-1]["content"].lower()

        if "整理" in user_message or "organize" in user_message:
            return '''{
                "title": "整理后的标题",
                "content": "# 整理后的内容\n\n这是AI整理后的笔记内容，结构更加清晰。",
                "tags": ["AI整理", "结构化"],
                "summary": "这是AI生成的摘要"
            }'''
        elif "todo" in user_message or "提取" in user_message:
            return '''{
                "todos": [
                    {"content": "完成项目文档编写", "priority": "high"},
                    {"content": "进行代码审查", "priority": "medium"},
                    {"content": "更新项目进度", "priority": "low"}
                ],
                "summary": "从笔记中提取了3个重要任务"
            }'''
        else:
            return '{"message": "这是一个模拟响应"}'

    async def organize_note_content(self, title: str, content: str) -> OrganizedContent:
        """AI智能整理笔记内容"""
        try:
            logger.info(f"开始整理笔记: {title}")

            prompt = f"""
            请帮我整理以下笔记内容，使其结构更清晰、逻辑更严谨：

            原标题：{title}
            原内容：
            {content}

            请按照以下格式返回整理结果（JSON格式）：
            {{
                "title": "优化后的标题",
                "content": "优化后的内容（使用Markdown格式）",
                "tags": ["标签1", "标签2"],
                "summary": "内容摘要（50字以内）"
            }}

            要求：
            1. 标题要简洁明了，准确概括内容
            2. 内容要有清晰的结构，使用Markdown格式
            3. 标签要准确反映内容主题
            4. 摘要要简洁概括主要内容
            """

            messages = [
                {"role": "system", "content": "你是一个专业的内容整理助手，擅长优化文本结构和逻辑。"},
                {"role": "user", "content": prompt}
            ]

            # 优先使用Kimi API
            if self.kimi_api_key:
                response_text = await self._call_kimi_api(messages)
            elif self.openai_api_key:
                response_text = await self._call_openai_api(messages)
            else:
                response_text = await self._get_mock_response(messages)

            # 解析响应
            try:
                result = json.loads(response_text)
                return OrganizedContent(
                    title=result.get("title", title),
                    content=result.get("content", content),
                    tags=result.get("tags", []),
                    summary=result.get("summary", "")
                )
            except json.JSONDecodeError:
                logger.error(f"AI响应格式错误: {response_text}")
                # 使用默认结果
                return OrganizedContent(
                    title=f"整理的: {title}",
                    content=f"# {title}\n\n{content}",
                    tags=["整理"],
                    summary="AI整理后的内容"
                )

        except Exception as e:
            logger.error(f"AI整理笔记失败: {str(e)}")
            # 返回原始内容
            return OrganizedContent(
                title=title,
                content=content,
                tags=[],
                summary=""
            )

    async def extract_todos_from_note(self, title: str, content: str) -> TodoExtractionResult:
        """从笔记中提取Todo事项"""
        try:
            logger.info(f"开始提取Todo: {title}")

            prompt = f"""
            请从以下笔记内容中提取所有待办事项（Todo）：

            标题：{title}
            内容：
            {content}

            请按照以下格式返回提取结果（JSON格式）：
            {{
                "todos": [
                    {{
                        "content": "具体任务描述",
                        "priority": "high"  // 优先级：high, medium, low
                    }}
                ],
                "summary": "提取总结（30字以内）"
            }}

            要求：
            1. 只提取明确的任务或待办事项
            2. 每个任务要有清晰的描述
            3. 根据重要性和紧急程度判断优先级
            4. 摘要要说明提取了多少个任务
            """

            messages = [
                {"role": "system", "content": "你是一个专业的任务提取助手，擅长从文本中识别和提取待办事项。"},
                {"role": "user", "content": prompt}
            ]

            # 优先使用Kimi API
            if self.kimi_api_key:
                response_text = await self._call_kimi_api(messages)
            elif self.openai_api_key:
                response_text = await self._call_openai_api(messages)
            else:
                response_text = await self._get_mock_response(messages)

            # 解析响应
            try:
                result = json.loads(response_text)
                todos = []
                for todo_data in result.get("todos", []):
                    todos.append(ExtractedTodo(
                        content=todo_data.get("content", ""),
                        priority=todo_data.get("priority", "medium")
                    ))

                return TodoExtractionResult(
                    todos=todos,
                    summary=result.get("summary", f"提取了{len(todos)}个任务")
                )
            except json.JSONDecodeError:
                logger.error(f"AI响应格式错误: {response_text}")
                # 使用默认结果
                return TodoExtractionResult(
                    todos=[
                        ExtractedTodo(content="完成笔记整理", priority="medium"),
                        ExtractedTodo(content="检查提取结果", priority="low")
                    ],
                    summary="提取了2个任务"
                )

        except Exception as e:
            logger.error(f"AI提取Todo失败: {str(e)}")
            # 返回空结果
            return TodoExtractionResult(
                todos=[],
                summary="提取失败"
            )

    async def generate_summary(self, title: str, content: str, max_length: int = 100) -> str:
        """生成内容摘要"""
        try:
            prompt = f"""
            请为以下内容生成一个简洁的摘要（{max_length}字以内）：

            标题：{title}
            内容：{content[:1000]}  # 限制内容长度避免超出token限制

            请只返回摘要内容，不要包含其他信息。
            """

            messages = [
                {"role": "system", "content": "你是一个专业的内容摘要助手，擅长提取文本的核心要点。"},
                {"role": "user", "content": prompt}
            ]

            if self.kimi_api_key:
                summary = await self._call_kimi_api(messages)
            elif self.openai_api_key:
                summary = await self._call_openai_api(messages)
            else:
                # 简单的摘要生成
                words = content.split()
                if len(words) > max_length // 2:
                    summary = " ".join(words[:max_length // 2]) + "..."
                else:
                    summary = content

            return summary.strip()

        except Exception as e:
            logger.error(f"生成摘要失败: {str(e)}")
            # 返回简单的截断摘要
            words = content.split()
            if len(words) > max_length // 2:
                return " ".join(words[:max_length // 2]) + "..."
            return content

# 创建服务实例
ai_service = AIService()