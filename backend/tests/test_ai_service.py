/**
 * AI服务测试
 * 测试AI服务的各种功能，包括API调用、错误处理、模拟响应等
 */

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from httpx import Response, RequestError

from services.ai_service import (
    AIService,
    OrganizedContent,
    ExtractedTodo,
    TodoExtractionResult
)


class TestAIService:
    """AI服务测试类"""

    @pytest.fixture
    def ai_service(self):
        """创建AI服务实例"""
        service = AIService()
        service.kimi_api_key = "test-kimi-key"
        service.openai_api_key = "test-openai-key"
        return service

    @pytest.fixture
    def mock_httpx_client(self):
        """模拟HTTP客户端"""
        with patch('services.ai_service.httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            yield mock_client

    def test_ai_service_initialization(self):
        """测试AI服务初始化"""
        service = AIService()
        assert service.kimi_api_key is None
        assert service.openai_api_key is None
        assert service.timeout == 30.0

    def test_ai_service_with_config(self, monkeypatch):
        """测试带配置的AI服务初始化"""
        monkeypatch.setattr('services.ai_service.settings.KIMI_API_KEY', 'test-kimi')
        monkeypatch.setattr('services.ai_service.settings.OPENAI_API_KEY', 'test-openai')

        service = AIService()
        assert service.kimi_api_key == 'test-kimi'
        assert service.openai_api_key == 'test-openai'

    @pytest.mark.asyncio
    async def test_call_kimi_api_success(self, ai_service, mock_httpx_client):
        """测试成功调用Kimi API"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "测试响应内容"
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        messages = [
            {"role": "user", "content": "测试消息"}
        ]

        result = await ai_service._call_kimi_api(messages)

        assert result == "测试响应内容"
        mock_httpx_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_call_kimi_api_failure(self, ai_service, mock_httpx_client):
        """测试Kimi API调用失败"""
        # 配置模拟失败响应
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "服务器错误"
        mock_httpx_client.post.return_value = mock_response

        messages = [
            {"role": "user", "content": "测试消息"}
        ]

        # 应该返回模拟响应
        result = await ai_service._call_kimi_api(messages)

        # 验证返回了模拟响应
        assert "模拟响应" in result

    @pytest.mark.asyncio
    async def test_call_kimi_api_exception(self, ai_service, mock_httpx_client):
        """测试Kimi API调用异常"""
        # 配置模拟异常
        mock_httpx_client.post.side_effect = RequestError("网络错误")

        messages = [
            {"role": "user", "content": "测试消息"}
        ]

        # 应该返回模拟响应
        result = await ai_service._call_kimi_api(messages)

        # 验证返回了模拟响应
        assert "模拟响应" in result

    @pytest.mark.asyncio
    async def test_call_kimi_api_no_key(self, ai_service):
        """测试没有API密钥时的Kimi调用"""
        ai_service.kimi_api_key = None

        messages = [
            {"role": "user", "content": "测试消息"}
        ]

        result = await ai_service._call_kimi_api(messages)

        # 验证返回了模拟响应
        assert "模拟响应" in result

    @pytest.mark.asyncio
    async def test_call_openai_api_success(self, ai_service, mock_httpx_client):
        """测试成功调用OpenAI API"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "OpenAI测试响应"
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        messages = [
            {"role": "user", "content": "测试消息"}
        ]

        result = await ai_service._call_openai_api(messages)

        assert result == "OpenAI测试响应"
        mock_httpx_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_call_openai_api_no_key(self, ai_service):
        """测试没有API密钥时的OpenAI调用"""
        ai_service.openai_api_key = None

        messages = [
            {"role": "user", "content": "测试消息"}
        ]

        result = await ai_service._call_openai_api(messages)

        # 验证返回了模拟响应
        assert "模拟响应" in result

    @pytest.mark.asyncio
    async def test_get_mock_response_organize(self, ai_service):
        """测试获取整理相关的模拟响应"""
        messages = [
            {"role": "user", "content": "请整理这段内容"}
        ]

        result = await ai_service._get_mock_response(messages)

        # 验证返回了整理相关的模拟响应
        result_data = json.loads(result)
        assert "title" in result_data
        assert "content" in result_data
        assert "tags" in result_data
        assert "summary" in result_data

    @pytest.mark.asyncio
    async def test_get_mock_response_todo_extraction(self, ai_service):
        """测试获取Todo提取相关的模拟响应"""
        messages = [
            {"role": "user", "content": "请提取todo任务"}
        ]

        result = await ai_service._get_mock_response(messages)

        # 验证返回了Todo提取相关的模拟响应
        result_data = json.loads(result)
        assert "todos" in result_data
        assert "summary" in result_data
        assert len(result_data["todos"]) > 0

    @pytest.mark.asyncio
    async def test_get_mock_response_default(self, ai_service):
        """测试获取默认模拟响应"""
        messages = [
            {"role": "user", "content": "其他请求"}
        ]

        result = await ai_service._get_mock_response(messages)

        # 验证返回了默认模拟响应
        result_data = json.loads(result)
        assert "message" in result_data

    @pytest.mark.asyncio
    async def test_organize_note_content_success(self, ai_service, mock_httpx_client):
        """测试成功整理笔记内容"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "title": "优化后的标题",
                        "content": "# 优化后的内容\n\n这是优化后的内容。",
                        "tags": ["标签1", "标签2"],
                        "summary": "内容摘要"
                    })
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "原始标题"
        content = "原始内容"

        result = await ai_service.organize_note_content(title, content)

        assert isinstance(result, OrganizedContent)
        assert result.title == "优化后的标题"
        assert "优化后的内容" in result.content
        assert result.tags == ["标签1", "标签2"]
        assert result.summary == "内容摘要"

    @pytest.mark.asyncio
    async def test_organize_note_content_json_error(self, ai_service, mock_httpx_client):
        """测试AI响应JSON解析错误"""
        # 配置模拟响应（无效的JSON）
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "无效的JSON响应"
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "原始标题"
        content = "原始内容"

        result = await ai_service.organize_note_content(title, content)

        # 验证返回了默认结果
        assert isinstance(result, OrganizedContent)
        assert "整理的:" in result.title
        assert result.content.startswith("# 原始标题")

    @pytest.mark.asyncio
    async def test_organize_note_content_exception(self, ai_service, mock_httpx_client):
        """测试整理笔记时发生异常"""
        # 配置模拟异常
        mock_httpx_client.post.side_effect = Exception("API错误")

        title = "原始标题"
        content = "原始内容"

        result = await ai_service.organize_note_content(title, content)

        # 验证返回了原始内容
        assert isinstance(result, OrganizedContent)
        assert result.title == title
        assert result.content == content
        assert result.tags == []
        assert result.summary == ""

    @pytest.mark.asyncio
    async def test_extract_todos_from_note_success(self, ai_service, mock_httpx_client):
        """测试成功提取Todo事项"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "todos": [
                            {"content": "任务1", "priority": "high"},
                            {"content": "任务2", "priority": "medium"}
                        ],
                        "summary": "提取了2个任务"
                    })
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "会议记录"
        content = "我们需要完成任务1和任务2"

        result = await ai_service.extract_todos_from_note(title, content)

        assert isinstance(result, TodoExtractionResult)
        assert len(result.todos) == 2
        assert result.todos[0].content == "任务1"
        assert result.todos[0].priority == "high"
        assert result.todos[1].content == "任务2"
        assert result.todos[1].priority == "medium"
        assert result.summary == "提取了2个任务"

    @pytest.mark.asyncio
    async def test_extract_todos_from_note_json_error(self, ai_service, mock_httpx_client):
        """测试Todo提取JSON解析错误"""
        # 配置模拟响应（无效的JSON）
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "无效的JSON响应"
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "会议记录"
        content = "我们需要完成任务"

        result = await ai_service.extract_todos_from_note(title, content)

        # 验证返回了默认结果
        assert isinstance(result, TodoExtractionResult)
        assert len(result.todos) == 2  # 默认结果包含2个任务
        assert result.todos[0].content == "完成笔记整理"
        assert result.summary == "提取了2个任务"

    @pytest.mark.asyncio
    async def test_extract_todos_from_note_exception(self, ai_service, mock_httpx_client):
        """测试提取Todo时发生异常"""
        # 配置模拟异常
        mock_httpx_client.post.side_effect = Exception("API错误")

        title = "会议记录"
        content = "我们需要完成任务"

        result = await ai_service.extract_todos_from_note(title, content)

        # 验证返回了空结果
        assert isinstance(result, TodoExtractionResult)
        assert len(result.todos) == 0
        assert result.summary == "提取失败"

    @pytest.mark.asyncio
    async def test_generate_summary_success(self, ai_service, mock_httpx_client):
        """测试成功生成摘要"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "这是生成的摘要"
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "测试标题"
        content = "这是需要生成摘要的长内容..." * 50

        result = await ai_service.generate_summary(title, content)

        assert result == "这是生成的摘要"

    @pytest.mark.asyncio
    async def test_generate_summary_no_key(self, ai_service):
        """测试没有API密钥时的摘要生成"""
        ai_service.kimi_api_key = None
        ai_service.openai_api_key = None

        title = "测试标题"
        content = "这是需要生成摘要的长内容..." * 50

        result = await ai_service.generate_summary(title, content)

        # 验证返回了截断的内容
        assert isinstance(result, str)
        assert len(result) <= len(content)

    @pytest.mark.asyncio
    async def test_generate_summary_exception(self, ai_service, mock_httpx_client):
        """测试生成摘要时发生异常"""
        # 配置模拟异常
        mock_httpx_client.post.side_effect = Exception("API错误")

        title = "测试标题"
        content = "这是需要生成摘要的长内容..." * 50

        result = await ai_service.generate_summary(title, content)

        # 验证返回了截断的内容
        assert isinstance(result, str)
        assert result.endswith("...")

    @pytest.mark.asyncio
    async def test_generate_summary_short_content(self, ai_service, mock_httpx_client):
        """测试短内容的摘要生成"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "短内容摘要"
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "测试标题"
        content = "短内容"

        result = await ai_service.generate_summary(title, content)

        assert result == "短内容摘要"

    @pytest.mark.asyncio
    async def test_organize_note_content_with_openai_fallback(self, ai_service, mock_httpx_client):
        """测试OpenAI回退机制"""
        # 配置Kimi失败，OpenAI成功
        ai_service.kimi_api_key = "invalid-key"
        ai_service.openai_api_key = "valid-key"

        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "title": "OpenAI优化标题",
                        "content": "# OpenAI优化内容",
                        "tags": ["OpenAI"],
                        "summary": "OpenAI摘要"
                    })
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "原始标题"
        content = "原始内容"

        result = await ai_service.organize_note_content(title, content)

        assert isinstance(result, OrganizedContent)
        assert result.title == "OpenAI优化标题"

    @pytest.mark.asyncio
    async def test_api_timeout_handling(self, ai_service, mock_httpx_client):
        """测试API超时处理"""
        # 配置模拟超时
        from asyncio import TimeoutError
        mock_httpx_client.post.side_effect = TimeoutError("请求超时")

        title = "测试标题"
        content = "测试内容"

        # 测试整理功能
        result = await ai_service.organize_note_content(title, content)
        assert isinstance(result, OrganizedContent)

        # 测试Todo提取功能
        result = await ai_service.extract_todos_from_note(title, content)
        assert isinstance(result, TodoExtractionResult)

    @pytest.mark.asyncio
    async def test_concurrent_ai_requests(self, ai_service, mock_httpx_client):
        """测试并发AI请求"""
        # 配置模拟响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "title": "并发测试标题",
                        "content": "并发测试内容",
                        "tags": ["并发"],
                        "summary": "并发摘要"
                    })
                }
            }]
        }
        mock_httpx_client.post.return_value = mock_response

        title = "测试标题"
        content = "测试内容"

        # 并发执行多个请求
        import asyncio
        tasks = [
            ai_service.organize_note_content(title, content),
            ai_service.extract_todos_from_note(title, content),
            ai_service.generate_summary(title, content)
        ]

        results = await asyncio.gather(*tasks)

        # 验证所有请求都成功完成
        assert len(results) == 3
        assert isinstance(results[0], OrganizedContent)
        assert isinstance(results[1], TodoExtractionResult)
        assert isinstance(results[2], str)

    def test_pydantic_models_validation(self):
        """测试Pydantic模型验证"""
        # 测试OrganizedContent模型
        organized = OrganizedContent(
            title="测试标题",
            content="测试内容",
            tags=["标签1", "标签2"],
            summary="测试摘要"
        )
        assert organized.title == "测试标题"
        assert organized.content == "测试内容"
        assert organized.tags == ["标签1", "标签2"]
        assert organized.summary == "测试摘要"

        # 测试ExtractedTodo模型
        todo = ExtractedTodo(
            content="测试任务",
            priority="high"
        )
        assert todo.content == "测试任务"
        assert todo.priority == "high"

        # 测试TodoExtractionResult模型
        extraction = TodoExtractionResult(
            todos=[todo],
            summary="提取了1个任务"
        )
        assert len(extraction.todos) == 1
        assert extraction.todos[0] == todo
        assert extraction.summary == "提取了1个任务"

    def test_pydantic_models_invalid_data(self):
        """测试Pydantic模型无效数据"""
        # 测试优先级验证
        with pytest.raises(ValueError):
            ExtractedTodo(
                content="测试任务",
                priority="invalid_priority"  # 无效优先级
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])