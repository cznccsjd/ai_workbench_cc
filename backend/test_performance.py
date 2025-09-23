"""
AI记事本智能整理功能完整性能测试
"""
import asyncio
import time
import statistics
from typing import List
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ai_service import AIService

class PerformanceMetrics:
    """性能指标收集器"""
    def __init__(self):
        self.response_times = []
        self.success_count = 0
        self.error_count = 0
        self.start_time = time.time()

    def record_success(self, response_time: float):
        self.response_times.append(response_time)
        self.success_count += 1

    def record_error(self):
        self.error_count += 1

    def get_report(self) -> dict:
        total_time = time.time() - self.start_time
        if self.response_times:
            return {
                "total_requests": self.success_count + self.error_count,
                "success_count": self.success_count,
                "error_count": self.error_count,
                "success_rate": self.success_count / (self.success_count + self.error_count) * 100,
                "avg_response_time": statistics.mean(self.response_times),
                "min_response_time": min(self.response_times),
                "max_response_time": max(self.response_times),
                "median_response_time": statistics.median(self.response_times),
                "total_test_time": total_time,
                "requests_per_second": (self.success_count + self.error_count) / total_time
            }
        else:
            return {
                "total_requests": self.success_count + self.error_count,
                "success_count": self.success_count,
                "error_count": self.error_count,
                "success_rate": 0,
                "total_test_time": total_time
            }

async def test_organize_performance(ai_service: AIService, test_cases: List[tuple], metrics: PerformanceMetrics):
    """测试AI整理功能性能"""
    print("🧪 测试AI整理功能...")

    for i, (title, content) in enumerate(test_cases):
        start_time = time.time()
        try:
            result = await ai_service.organize_note_content(title, content)
            response_time = time.time() - start_time

            # 验证响应质量
            if result.title and result.content and result.summary:
                metrics.record_success(response_time)
                print(f"  ✅ 测试 {i+1}: {response_time:.2f}s - {result.title}")
            else:
                metrics.record_error()
                print(f"  ❌ 测试 {i+1}: 响应不完整")

        except Exception as e:
            metrics.record_error()
            print(f"  ❌ 测试 {i+1}: 异常 - {str(e)}")

async def test_extract_todos_performance(ai_service: AIService, test_cases: List[tuple], metrics: PerformanceMetrics):
    """测试Todo提取功能性能"""
    print("📋 测试Todo提取功能...")

    for i, (title, content) in enumerate(test_cases):
        start_time = time.time()
        try:
            result = await ai_service.extract_todos_from_note(title, content)
            response_time = time.time() - start_time

            # 验证响应质量
            if result.summary and isinstance(result.todos, list):
                metrics.record_success(response_time)
                print(f"  ✅ 测试 {i+1}: {response_time:.2f}s - 提取了{len(result.todos)}个任务")
            else:
                metrics.record_error()
                print(f"  ❌ 测试 {i+1}: 响应不完整")

        except Exception as e:
            metrics.record_error()
            print(f"  ❌ 测试 {i+1}: 异常 - {str(e)}")

async def test_concurrent_requests(ai_service: AIService, metrics: PerformanceMetrics):
    """测试并发请求性能"""
    print("⚡ 测试并发请求性能...")

    # 创建并发任务
    tasks = []
    for i in range(5):
        task = ai_service.organize_note_content(
            f"并发测试笔记{i}",
            f"这是第{i}个并发测试的笔记内容，包含一些重要信息和任务项目。需要进行整理和优化。"
        )
        tasks.append(task)

    start_time = time.time()
    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.time() - start_time

        success_count = 0
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                metrics.record_error()
                print(f"  ❌ 并发任务 {i+1}: {str(result)}")
            else:
                metrics.record_success(total_time / 5)  # 平均每个请求的时间
                success_count += 1
                print(f"  ✅ 并发任务 {i+1}: 成功")

        print(f"  📊 并发测试完成: {success_count}/5 成功, 总耗时: {total_time:.2f}s")

    except Exception as e:
        print(f"  ❌ 并发测试失败: {str(e)}")

async def run_comprehensive_test():
    """运行综合测试"""
    print("🚀 开始AI记事本智能整理功能综合性能测试")
    print("=" * 60)

    ai_service = AIService()

    # 测试用例
    organize_test_cases = [
        ("会议记录", "今日会议讨论了产品发布计划、技术架构优化、团队协作流程等重要议题。"),
        ("项目文档", "项目包含前端开发、后端开发、数据库设计、测试验证、部署上线等多个阶段。"),
        ("学习笔记", "学习了Python异步编程、FastAPI框架使用、数据库优化、性能监控等技术知识。"),
        ("工作计划", "下周需要完成代码审查、功能测试、文档整理、客户沟通、项目汇报等工作。"),
        ("技术调研", "调研了AI模型集成、接口设计、错误处理、性能优化、安全防护等技术方案。")
    ]

    todo_test_cases = [
        ("日常工作", "明天要完成API开发，进行单元测试，部署到测试环境，准备演示材料。"),
        ("项目管理", "需要安排团队会议，分配开发任务，跟进项目进度，准备客户汇报。"),
        ("技术优化", "要优化数据库查询，改进缓存机制，提升响应速度，修复已知bug。"),
        ("学习计划", "学习新的技术框架，阅读技术文档，完成练习项目，参加技术分享。"),
        ("沟通协调", "与产品经理对接需求，跟设计师确认界面，和测试团队沟通测试计划。")
    ]

    # 整理功能测试
    organize_metrics = PerformanceMetrics()
    await test_organize_performance(ai_service, organize_test_cases, organize_metrics)

    print("\n" + "=" * 60)

    # Todo提取功能测试
    todo_metrics = PerformanceMetrics()
    await test_extract_todos_performance(ai_service, todo_test_cases, todo_metrics)

    print("\n" + "=" * 60)

    # 并发测试
    concurrent_metrics = PerformanceMetrics()
    await test_concurrent_requests(ai_service, concurrent_metrics)

    print("\n" + "=" * 60)
    print("📊 测试结果汇总")
    print("=" * 60)

    # 整理功能报告
    organize_report = organize_metrics.get_report()
    print(f"🧪 AI整理功能测试:")
    print(f"  总请求数: {organize_report['total_requests']}")
    print(f"  成功数: {organize_report['success_count']}")
    print(f"  失败数: {organize_report['error_count']}")
    print(f"  成功率: {organize_report['success_rate']:.1f}%")
    if organize_report.get('avg_response_time'):
        print(f"  平均响应时间: {organize_report['avg_response_time']:.2f}s")
        print(f"  最快响应时间: {organize_report['min_response_time']:.2f}s")
        print(f"  最慢响应时间: {organize_report['max_response_time']:.2f}s")

    print()

    # Todo提取报告
    todo_report = todo_metrics.get_report()
    print(f"📋 Todo提取功能测试:")
    print(f"  总请求数: {todo_report['total_requests']}")
    print(f"  成功数: {todo_report['success_count']}")
    print(f"  失败数: {todo_report['error_count']}")
    print(f"  成功率: {todo_report['success_rate']:.1f}%")
    if todo_report.get('avg_response_time'):
        print(f"  平均响应时间: {todo_report['avg_response_time']:.2f}s")

    print()

    # 并发测试报告
    concurrent_report = concurrent_metrics.get_report()
    print(f"⚡ 并发测试:")
    print(f"  总请求数: {concurrent_report['total_requests']}")
    print(f"  成功数: {concurrent_report['success_count']}")
    print(f"  成功率: {concurrent_report['success_rate']:.1f}%")

    print("\n" + "=" * 60)

    # 综合评估
    total_success = organize_report['success_count'] + todo_report['success_count'] + concurrent_report['success_count']
    total_requests = organize_report['total_requests'] + todo_report['total_requests'] + concurrent_report['total_requests']
    overall_success_rate = total_success / total_requests * 100 if total_requests > 0 else 0

    print(f"✅ 综合测试结果:")
    print(f"  总体成功率: {overall_success_rate:.1f}%")

    if overall_success_rate >= 90:
        print("  🎉 测试状态: 优秀 - AI记事本功能完全正常!")
    elif overall_success_rate >= 80:
        print("  ✅ 测试状态: 良好 - AI记事本功能基本正常")
    elif overall_success_rate >= 70:
        print("  ⚠️  测试状态: 一般 - AI记事本功能需要优化")
    else:
        print("  ❌ 测试状态: 较差 - AI记事本功能需要修复")

    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_comprehensive_test())