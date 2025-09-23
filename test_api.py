#!/usr/bin/env python3
"""
AI记事本API测试脚本
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_health():
    """测试健康检查接口"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_create_note():
    """测试创建笔记"""
    note_data = {
        "title": "测试笔记",
        "content": "这是一个测试笔记。\n需要完成以下任务：\n1. 整理文档\n2. 测试功能\n3. 完成开发"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/notes/",
            json=note_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Create note: {response.status_code}")
        if response.status_code == 201 or response.status_code == 200:
            note = response.json()
            print(f"Created note ID: {note.get('id')}")
            return note
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def test_organize_note(note_id):
    """测试AI整理笔记"""
    try:
        response = requests.post(f"{BASE_URL}/api/notes/{note_id}/organize")
        print(f"Organize note: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Organized content: {result}")
            return result
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def test_extract_todos(note_id):
    """测试AI提取Todo"""
    try:
        response = requests.post(f"{BASE_URL}/api/notes/{note_id}/extract-todos")
        print(f"Extract todos: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Extracted todos: {result}")
            return result
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def main():
    print("=== AI记事本API测试 ===")

    # 测试健康检查
    print("\n1. 测试健康检查接口")
    if not test_health():
        print("健康检查失败，停止测试")
        return

    # 测试创建笔记
    print("\n2. 测试创建笔记")
    note = test_create_note()
    if not note:
        print("创建笔记失败，停止测试")
        return

    note_id = note.get('id')
    print(f"成功创建笔记，ID: {note_id}")

    # 测试AI整理
    print("\n3. 测试AI整理功能")
    organize_result = test_organize_note(note_id)

    # 测试AI提取Todo
    print("\n4. 测试AI提取Todo功能")
    todo_result = test_extract_todos(note_id)

    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    main()