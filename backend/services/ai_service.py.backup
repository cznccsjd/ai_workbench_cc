#
# AI服务
# 提供AI智能整理、Todo提取、对话等功能
#

import logging
from typing import List, Optional, Dict, Any, AsyncGenerator
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

class AIModel(BaseModel):
    """AI模型信息"""
    id: str
    name: str
    provider: str
    max_tokens: int
    description: str
    is_available: bool = True

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

    async def chat_with_model(self, messages: List[Dict[str, Any]], model: str = "kimi-moonshot-v1-8k",
                            temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """与AI模型进行对话"""
        try:
            logger.info(f"开始AI对话: model={model}, messages_count={len(messages)}")

            # 准备消息格式
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

            # 根据模型选择API
            if "kimi" in model.lower() or "moonshot" in model.lower():
                response = await self._call_kimi_api(formatted_messages, model)
            elif "gpt" in model.lower() or "openai" in model.lower():
                response = await self._call_openai_api(formatted_messages, model)
            else:
                # 默认使用Kimi
                response = await self._call_kimi_api(formatted_messages, "moonshot-v1-8k")

            return response

        except Exception as e:
            logger.error(f"AI对话失败: {str(e)}")
            return f"抱歉，我遇到了一些问题：{str(e)}"

    async def chat_with_model_stream(self, messages: List[Dict[str, Any]], model: str = "kimi-moonshot-v1-8k",
                                   temperature: float = 0.7, max_tokens: int = 2000) -> AsyncGenerator[str, None]:
        """与AI模型进行流式对话"""
        try:
            logger.info(f"开始流式AI对话: model={model}")

            # 准备消息格式
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

            # 流式调用Kimi API（示例实现）
            if "kimi" in model.lower() or "moonshot" in model.lower():
                async for chunk in self._call_kimi_api_stream(formatted_messages, model):
                    yield chunk
            else:
                # 非流式调用，然后分块返回
                response = await self.chat_with_model(formatted_messages, model, temperature, max_tokens)
                # 简单分块模拟流式响应
                words = response.split()
                for i, word in enumerate(words):
                    chunk = word + (" " if i < len(words) - 1 else "")
                    yield chunk
                    await asyncio.sleep(0.05)  # 模拟打字效果

        except Exception as e:
            logger.error(f"流式AI对话失败: {str(e)}")
            yield f"抱歉，我遇到了一些问题：{str(e)}"

    async def _call_kimi_api_stream(self, messages: List[dict], model: str = "moonshot-v1-8k") -> AsyncGenerator[str, None]:
        """流式调用Kimi API"""
        if not self.kimi_api_key:
            logger.warning("Kimi API密钥未配置，使用模拟流式数据")
            response = await self._get_mock_response(messages)
            words = response.split()
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield chunk
                await asyncio.sleep(0.05)
            return

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
                        "max_tokens": 2000,
                        "stream": True  # 启用流式响应
                    },
                    timeout=None
                )

                if response.status_code != 200:
                    logger.error(f"Kimi API流式调用失败: {response.status_code} - {response.text}")
                    yield "抱歉，AI服务暂时不可用。"
                    return

                # 处理流式响应
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # 移除 "data: " 前缀
                        if data == "[DONE]":
                            break

                        try:
                            chunk_data = json.loads(data)
                            delta = chunk_data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

        except Exception as e:
            logger.error(f"流式调用Kimi API异常: {str(e)}")
            yield f"抱歉，我遇到了一些问题：{str(e)}"

    async def get_available_models(self) -> List[AIModel]:
        """获取可用的AI模型列表"""
        models = [
            AIModel(
                id="kimi-moonshot-v1-8k",
                name="Kimi Moonshot v1 (8K)",
                provider="kimi",
                max_tokens=8000,
                description="Moonshot AI 的 Kimi 模型，支持长文本处理",
                is_available=bool(self.kimi_api_key)
            ),
            AIModel(
                id="kimi-moonshot-v1-32k",
                name="Kimi Moonshot v1 (32K)",
                provider="kimi",
                max_tokens=32000,
                description="Moonshot AI 的 Kimi 模型，支持更长文本处理",
                is_available=bool(self.kimi_api_key)
            ),
            AIModel(
                id="gpt-3.5-turbo",
                name="GPT-3.5 Turbo",
                provider="openai",
                max_tokens=4096,
                description="OpenAI GPT-3.5 Turbo 模型",
                is_available=bool(self.openai_api_key)
            ),
            AIModel(
                id="gpt-4-turbo",
                name="GPT-4 Turbo",
                provider="openai",
                max_tokens=128000,
                description="OpenAI GPT-4 Turbo 模型",
                is_available=bool(self.openai_api_key)
            )
        ]

        return [model for model in models if model.is_available]

# 创建服务实例
ai_service = AIService()