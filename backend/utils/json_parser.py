"""
AI服务JSON解析增强功能
"""
import json
import re
import logging

def extract_json_from_response(text: str) -> dict:
    """从AI响应中提取JSON数据"""
    if not text:
        return {}

    # 清理文本
    text = text.strip()

    # 方法1: 直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 方法2: 查找JSON代码块
    json_patterns = [
        r'```json\s*(\{.*?\})\s*```',  # ```json { ... } ```
        r'```\s*(\{.*?\})\s*```',      # ``` { ... } ```
        r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})',  # 查找完整的JSON对象
    ]

    for pattern in json_patterns:
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue

    # 方法3: 逐行查找并组合
    lines = text.split('\n')
    json_lines = []
    in_json = False
    brace_count = 0

    for line in lines:
        line = line.strip()
        if line.startswith('{'):
            in_json = True
            brace_count = line.count('{') - line.count('}')
            json_lines = [line]
        elif in_json:
            json_lines.append(line)
            brace_count += line.count('{') - line.count('}')
            if brace_count <= 0:
                try:
                    json_text = '\n'.join(json_lines)
                    return json.loads(json_text)
                except json.JSONDecodeError:
                    in_json = False
                    json_lines = []
                    brace_count = 0

    return {}

# 测试
if __name__ == "__main__":
    test_cases = [
        '{"title": "测试", "content": "内容"}',
        '''这是一个响应：
        {
          "title": "项目计划",
          "content": "这是内容",
          "tags": ["标签1", "标签2"],
          "summary": "摘要"
        }''',
        '''```json
        {
          "title": "测试标题",
          "content": "测试内容"
        }
        ```''',
    ]

    for i, test in enumerate(test_cases):
        result = extract_json_from_response(test)
        print(f"测试 {i+1}: {result}")