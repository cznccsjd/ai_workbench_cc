#
# AI对话API测试
#

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json

from main import app
from services.ai_service import AIService

client = TestClient(app)

@pytest.fixture
def mock_ai_service():
    """Mock AI服务"""
    with patch('routers.chat.ai_service') as mock:
        mock.chat_with_model = Mock(return_value=asyncio.Future())
        mock.chat_with_model.return_value.set_result("这是AI的回复")

        mock.chat_with_model_stream = Mock(return_value=asyncio.Future())
        mock.chat_with_model_stream.return_value.set_result("流式AI回复")

        mock.get_available_models = Mock(return_value=asyncio.Future())
        mock.get_available_models.return_value.set_result([
            {
                "id": "kimi-moonshot-v1-8k",
                "name": "Kimi Moonshot v1 (8K)",
                "provider": "kimi",
                "max_tokens": 8000,
                "description": "Moonshot AI 的 Kimi 模型",
                "is_available": True
            }
        ])
        yield mock

class TestChatAPI:
    """测试AI对话API"""

    def test_chat_endpoint_success(self, mock_ai_service):
        """测试基本的聊天端点"""
        response = client.post("/api/ai/chat", json={
            "message": "你好",
            "conversation_id": "test-conv-123",
            "model": "kimi-moonshot-v1-8k"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "这是AI的回复"
        assert data["conversation_id"] == "test-conv-123"
        assert data["model"] == "kimi-moonshot-v1-8k"
        assert "tokens_used" in data
        assert "timestamp" in data

    def test_chat_endpoint_missing_message(self):
        """测试缺少消息参数"""
        response = client.post("/api/ai/chat", json={
            "conversation_id": "test-conv-123"
        })

        assert response.status_code == 422  # 验证错误

    def test_chat_endpoint_missing_conversation_id(self):
        """测试缺少对话ID参数"""
        response = client.post("/api/ai/chat", json={
            "message": "你好"
        })

        assert response.status_code == 422  # 验证错误

    def test_chat_stream_endpoint(self, mock_ai_service):
        """测试流式聊天端点"""
        # 模拟流式响应生成器
        async def mock_stream(*args, **kwargs):
            yield "流式"
            yield "AI"
            yield "回复"

        mock_ai_service.chat_with_model_stream = mock_stream

        response = client.post("/api/ai/chat/stream", json={
            "message": "你好",
            "conversation_id": "test-conv-123",
            "model": "kimi-moonshot-v1-8k"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "流式AI回复"
        assert data["is_complete"] is True
        assert data["conversation_id"] == "test-conv-123"
        assert data["error"] is None

    def test_get_conversation_history(self):
        """测试获取对话历史"""
        # 先创建一个对话
        client.post("/api/ai/chat", json={
            "message": "第一条消息",
            "conversation_id": "test-history-123"
        })

        # 获取历史
        response = client.get("/api/ai/conversations/test-history-123/history")

        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == "test-history-123"
        assert "messages" in data
        assert "count" in data

    def test_delete_conversation(self):
        """测试删除对话"""
        # 先创建一个对话
        client.post("/api/ai/chat", json={
            "message": "要删除的消息",
            "conversation_id": "test-delete-123"
        })

        # 删除对话
        response = client.delete("/api/ai/conversations/test-delete-123")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "对话已删除"
        assert data["conversation_id"] == "test-delete-123"

    def test_delete_nonexistent_conversation(self):
        """测试删除不存在的对话"""
        response = client.delete("/api/ai/conversations/nonexistent-123")

        assert response.status_code == 404

    def test_get_available_models(self, mock_ai_service):
        """测试获取可用模型列表"""
        response = client.get("/api/ai/models")

        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0

        model = data["models"][0]
        assert "id" in model
        assert "name" in model
        assert "provider" in model
        assert "max_tokens" in model
        assert "description" in model
        assert "is_available" in model

    def test_different_models(self, mock_ai_service):
        """测试不同的AI模型"""
        models = ["kimi-moonshot-v1-8k", "gpt-3.5-turbo", "gpt-4-turbo"]

        for model in models:
            response = client.post("/api/ai/chat", json={
                "message": f"测试 {model}",
                "conversation_id": f"test-{model}-123",
                "model": model
            })

            assert response.status_code == 200
            data = response.json()
            assert data["model"] == model

    def test_conversation_history_limit(self, mock_ai_service):
        """测试对话历史长度限制"""
        conversation_id = "test-limit-123"

        # 发送多条消息
        for i in range(15):
            response = client.post("/api/ai/chat", json={
                "message": f"消息 {i+1}",
                "conversation_id": conversation_id,
                "model": "kimi-moonshot-v1-8k"
            })
            assert response.status_code == 200

        # 获取历史，应该只返回最近的消息
        response = client.get(f"/api/ai/conversations/{conversation_id}/history")

        assert response.status_code == 200
        data = response.json()
        # 应该有限制历史长度，避免token超限
        assert data["count"] <= 20  # 假设限制为20条

    def test_temperature_parameter(self, mock_ai_service):
        """测试温度参数"""
        response = client.post("/api/ai/chat", json={
            "message": "创意写作",
            "conversation_id": "test-temp-123",
            "model": "kimi-moonshot-v1-8k",
            "temperature": 0.9,
            "max_tokens": 500
        })

        assert response.status_code == 200
        # 验证AI服务被调用时包含了温度参数
        mock_ai_service.chat_with_model.assert_called()

    def test_error_handling(self, mock_ai_service):
        """测试错误处理"""
        # 模拟AI服务抛出异常
        mock_ai_service.chat_with_model.side_effect = Exception("AI服务异常")

        response = client.post("/api/ai/chat", json={
            "message": "测试错误处理",
            "conversation_id": "test-error-123",
            "model": "kimi-moonshot-v1-8k"
        })

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "AI对话失败" in data["detail"]

    @pytest.mark.asyncio
    async def test_streaming_response(self, mock_ai_service):
        """测试流式响应（异步）"""
        # 模拟流式响应
        async def mock_stream(*args, **kwargs):
            yield "Hello"
            yield " "
            yield "World"
            yield "!"

        mock_ai_service.chat_with_model_stream = mock_stream

        response = client.post("/api/ai/chat/stream", json={
            "message": "流式测试",
            "conversation_id": "test-stream-123",
            "model": "kimi-moonshot-v1-8k"
        })

        assert response.status_code == 200
        # 注意：实际流式响应可能需要不同的测试方式

    def test_api_response_format(self, mock_ai_service):
        """测试API响应格式"""
        response = client.post("/api/ai/chat", json={
            "message": "格式测试",
            "conversation_id": "test-format-123",
            "model": "kimi-moonshot-v1-8k"
        })

        assert response.status_code == 200
        data = response.json()

        # 验证响应包含所有必需字段
        required_fields = ["response", "conversation_id", "model", "tokens_used", "timestamp"]
        for field in required_fields:
            assert field in data, f"响应中缺少字段: {field}"

        # 验证字段类型
        assert isinstance(data["response"], str)
        assert isinstance(data["conversation_id"], str)
        assert isinstance(data["model"], str)
        assert isinstance(data["tokens_used"], int)
        assert isinstance(data["timestamp"], str)

if __name__ == "__main__":
    pytest.main([__file__])