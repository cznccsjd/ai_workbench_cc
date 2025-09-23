"""
AI服务单元测试
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from services.ai_service import AIService, OrganizedContent, TodoExtractionResult, ExtractedTodo

class TestAIService:
    """AI服务测试类"""

    @pytest.fixture
    def ai_service(self):
        """创建AI服务实例"""
        return AIService()

    @pytest.mark.asyncio
    async def test_organize_note_content_success(self, ai_service):
        """测试AI整理笔记成功案例"""
        title = "会议记录"
        content = "今天的会议讨论了产品发布计划，包括技术开发、市场推广、用户反馈收集等工作。"

        result = await ai_service.organize_note_content(title, content)

        assert isinstance(result, OrganizedContent)
        assert result.title
        assert result.content
        assert isinstance(result.tags, list)
        assert result.summary

    @pytest.mark.asyncio
    async def test_extract_todos_success(self, ai_service):
        """测试AI提取Todo成功案例"""
        title = "项目计划"
        content = "明天需要完成API开发，进行单元测试，部署到测试环境。"

        result = await ai_service.extract_todos_from_note(title, content)

        assert isinstance(result, TodoExtractionResult)
        assert isinstance(result.todos, list)
        assert len(result.todos) > 0
        assert result.summary

        for todo in result.todos:
            assert isinstance(todo, ExtractedTodo)
            assert todo.content
            assert todo.priority in ["low", "medium", "high"]

    @pytest.mark.asyncio
    async def test_organize_with_empty_content(self, ai_service):
        """测试空内容的整理"""
        result = await ai_service.organize_note_content("空标题", "")

        assert isinstance(result, OrganizedContent)
        assert result.title == "空标题"

    @pytest.mark.asyncio
    async def test_extract_todos_with_no_tasks(self, ai_service):
        """测试没有任务的内容提取"""
        result = await ai_service.extract_todos_from_note(
            "普通笔记",
            "这只是一些普通的描述性文字，没有具体的任务。"
        )

        assert isinstance(result, TodoExtractionResult)
        assert isinstance(result.todos, list)

    @pytest.mark.asyncio
    async def test_ai_service_with_api_failure(self, ai_service):
        """测试API调用失败时的降级处理"""
        # 模拟API密钥为空
        ai_service.kimi_api_key = ""
        ai_service.openai_api_key = ""

        result = await ai_service.organize_note_content("测试", "测试内容")

        assert isinstance(result, OrganizedContent)
        # 确保即使API失败也有合理的返回

    @pytest.mark.asyncio
    async def test_generate_summary(self, ai_service):
        """测试生成摘要功能"""
        title = "长文章"
        content = "这是一篇很长的文章" + "，包含了很多内容" * 100

        summary = await ai_service.generate_summary(title, content, max_length=50)

        assert isinstance(summary, str)
        assert len(summary) > 0

    @pytest.mark.asyncio
    async def test_get_available_models(self, ai_service):
        """测试获取可用模型"""
        models = await ai_service.get_available_models()

        assert isinstance(models, list)
        # 至少应该有一个模型可用（因为配置了Kimi API Key）
        assert len(models) > 0

        for model in models:
            assert hasattr(model, 'id')
            assert hasattr(model, 'name')
            assert hasattr(model, 'provider')
            assert hasattr(model, 'is_available')

    @pytest.mark.asyncio
    async def test_chat_with_model(self, ai_service):
        """测试AI对话功能"""
        messages = [
            {"role": "user", "content": "你好，请简单介绍一下你自己。"}
        ]

        response = await ai_service.chat_with_model(messages)

        assert isinstance(response, str)
        assert len(response) > 0

    @pytest.mark.asyncio
    async def test_error_handling_with_invalid_json(self, ai_service):
        """测试无效JSON响应的错误处理"""
        with patch.object(ai_service, '_call_kimi_api', return_value="这不是有效的JSON响应"):
            result = await ai_service.organize_note_content("测试", "测试内容")

            # 应该返回默认值而不是抛出异常
            assert isinstance(result, OrganizedContent)

# 性能测试
class TestAIServicePerformance:
    """AI服务性能测试"""

    @pytest.mark.asyncio
    async def test_concurrent_organize_requests(self):
        """测试并发整理请求"""
        ai_service = AIService()

        tasks = []
        for i in range(5):
            task = ai_service.organize_note_content(
                f"笔记{i}",
                f"这是第{i}个笔记的内容，包含一些任务和信息。"
            )
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        assert len(results) == 5
        for result in results:
            assert isinstance(result, OrganizedContent)

    @pytest.mark.asyncio
    async def test_large_content_handling(self):
        """测试大内容处理"""
        ai_service = AIService()

        # 创建大内容
        large_content = "这是一个长段落。" * 1000

        result = await ai_service.organize_note_content("大文档", large_content)

        assert isinstance(result, OrganizedContent)
        assert result.title
        assert result.content

if __name__ == "__main__":
    # 运行特定测试
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    # 简单测试示例
    async def run_basic_tests():
        ai_service = AIService()

        print("测试AI整理功能...")
        result1 = await ai_service.organize_note_content(
            "会议纪要",
            "今日会议要点：1. 确定产品发布时间 2. 分配开发任务 3. 制定测试计划"
        )
        print(f"整理结果: {result1.title}, 标签: {result1.tags}")

        print("测试Todo提取功能...")
        result2 = await ai_service.extract_todos_from_note(
            "工作安排",
            "明天要完成代码审查，准备测试数据，部署新版本。"
        )
        print(f"提取的任务数: {len(result2.todos)}")

        print("所有测试完成!")

    if len(sys.argv) > 1 and sys.argv[1] == "run":
        asyncio.run(run_basic_tests())