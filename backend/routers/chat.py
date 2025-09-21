#
# AI对话API路由
# 处理聊天消息、流式响应、对话历史等
#

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import asyncio
import logging
from datetime import datetime

from services.ai_service import AIService, ai_service
from database.base import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    model: Optional[str] = "kimi-moonshot-v1-8k"
    stream: bool = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    model: str
    tokens_used: int
    timestamp: str

class StreamResponse(BaseModel):
    content: str
    is_complete: bool
    conversation_id: str
    error: Optional[str] = None

# 存储对话历史（临时存储，后续应使用数据库）
conversation_history: Dict[str, List[Dict[str, Any]]] = {}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    与AI进行对话
    """
    try:
        logger.info(f"收到聊天请求: conversation_id={request.conversation_id}, model={request.model}")

        # 获取对话历史
        messages = conversation_history.get(request.conversation_id, [])

        # 添加用户消息到历史
        messages.append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        })

        # 限制历史长度，避免token超限
        max_history = 10
        if len(messages) > max_history:
            messages = messages[-max_history:]

        # 调用AI服务
        ai_response = await ai_service.chat_with_model(
            messages=messages,
            model=request.model or "kimi-moonshot-v1-8k",
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        # 添加AI回复到历史
        messages.append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.now().isoformat()
        })

        # 更新对话历史
        conversation_history[request.conversation_id] = messages

        # 估算token使用量（简单估算：中文字符数 * 1.5 + 英文单词数）
        tokens_used = len(request.message) * 2 + len(ai_response) * 2

        return ChatResponse(
            response=ai_response,
            conversation_id=request.conversation_id,
            model=request.model or "kimi-moonshot-v1-8k",
            tokens_used=tokens_used,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"AI对话失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI对话失败: {str(e)}")

@router.post("/chat/stream")
async def chat_with_ai_stream(request: ChatRequest):
    """
    与AI进行流式对话
    """
    try:
        logger.info(f"收到流式聊天请求: conversation_id={request.conversation_id}")

        # 获取对话历史
        messages = conversation_history.get(request.conversation_id, [])

        # 添加用户消息到历史
        messages.append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        })

        # 限制历史长度
        max_history = 10
        if len(messages) > max_history:
            messages = messages[-max_history:]

        # 流式调用AI服务
        full_response = ""

        async for chunk in ai_service.chat_with_model_stream(
            messages=messages,
            model=request.model or "kimi-moonshot-v1-8k",
            temperature=request.temperature,
            max_tokens=request.max_tokens
        ):
            full_response += chunk

            # 这里可以返回流式响应
            # 在实际应用中，应该使用WebSocket或Server-Sent Events

        # 添加AI回复到历史
        messages.append({
            "role": "assistant",
            "content": full_response,
            "timestamp": datetime.now().isoformat()
        })

        # 更新对话历史
        conversation_history[request.conversation_id] = messages

        # 估算token使用量
        tokens_used = len(request.message) * 2 + len(full_response) * 2

        return StreamResponse(
            content=full_response,
            is_complete=True,
            conversation_id=request.conversation_id,
            error=None
        )

    except Exception as e:
        logger.error(f"流式AI对话失败: {str(e)}")
        return StreamResponse(
            content="",
            is_complete=True,
            conversation_id=request.conversation_id,
            error=str(e)
        )

@router.get("/conversations/{conversation_id}/history")
async def get_conversation_history(conversation_id: str):
    """
    获取指定对话的历史记录
    """
    try:
        messages = conversation_history.get(conversation_id, [])
        return {
            "conversation_id": conversation_id,
            "messages": messages,
            "count": len(messages)
        }
    except Exception as e:
        logger.error(f"获取对话历史失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取对话历史失败: {str(e)}")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    删除指定对话
    """
    try:
        if conversation_id in conversation_history:
            del conversation_history[conversation_id]
            return {"message": "对话已删除", "conversation_id": conversation_id}
        else:
            raise HTTPException(status_code=404, detail="对话不存在")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除对话失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除对话失败: {str(e)}")

@router.get("/models")
async def get_available_models():
    """
    获取可用的AI模型列表
    """
    try:
        models = await ai_service.get_available_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"获取模型列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")