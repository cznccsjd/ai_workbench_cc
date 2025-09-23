#!/usr/bin/env python3
"""
测试AI服务连接
"""
import asyncio
import sys
sys.path.append('/c/Users/zjlo0/OneDrive/Document/workspace/CascadeProjects/ai_workbench_cc/backend')

from services.ai_service import AIService

async def test_ai_service():
    ai_service = AIService()

    print("=== AI服务测试 ===")
    print(f"Kimi API Key configured: {bool(ai_service.kimi_api_key)}")
    print(f"OpenAI API Key configured: {bool(ai_service.openai_api_key)}")

    # 测试简单的AI调用
    print("\n测试AI整理功能...")
    try:
        result = await ai_service.organize_note_content(
            "测试笔记",
            "这是一个测试内容，包含重要信息。"
        )
        print(f"整理结果: {result}")

        # 检查是否是真实的AI响应
        if "整理后的标题" in result.title or "AI整理" in result.tags:
            print("⚠️  使用的是Mock响应，不是真实AI服务")
        else:
            print("✅ 使用的是真实AI服务响应")

    except Exception as e:
        print(f"❌ AI服务调用失败: {e}")

    print("\n测试Todo提取功能...")
    try:
        result = await ai_service.extract_todos_from_note(
            "工作计划",
            "明天需要完成项目文档，后天进行代码审查，周五部署系统。"
        )
        print(f"提取结果: {result}")

        # 检查是否是真实的AI响应
        if any("完成项目文档编写" in todo.content for todo in result.todos):
            print("⚠️  使用的是Mock响应，不是真实AI服务")
        else:
            print("✅ 使用的是真实AI服务响应")

    except Exception as e:
        print(f"❌ Todo提取失败: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai_service())