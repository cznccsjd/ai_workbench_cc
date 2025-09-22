"""
项目管理看板API测试
测试所有看板相关的RESTful API端点
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import json

from main import app
from database import get_db
from models.user import User
from models.kanban import Board, List, Card

# 创建测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_boards.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 导入Base并创建表
from database.base import Base
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# 替换数据库依赖
app.dependency_overrides[get_db] = override_get_db

# 测试客户端
client = TestClient(app)

# 测试用户数据
TEST_USER_ID = "test_user_123"
TEST_USER_EMAIL = "test@example.com"

@pytest.fixture
def test_user():
    """测试用户夹具 - 认证服务会自动创建测试用户"""
    # 认证服务会在需要时自动创建测试用户
    # 这里只是返回测试用户的信息
    class MockUser:
        def __init__(self):
            self.id = TEST_USER_ID
            self.email = TEST_USER_EMAIL
            self.username = "testuser"
            self.is_active = True

    return MockUser()

@pytest.fixture
def auth_headers():
    """创建认证头"""
    return {"Authorization": "Bearer test_token"}

# ===== 看板管理测试 =====

class TestBoardManagement:
    """看板管理API测试"""

    def test_create_board_success(self, test_user, auth_headers):
        """测试创建看板成功"""
        board_data = {
            "name": "项目开发看板",
            "description": "管理开发项目进度",
            "background_color": "#4CAF50",
            "background_image": None
        }

        response = client.post("/api/boards", json=board_data, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == board_data["name"]
        assert data["description"] == board_data["description"]
        assert data["background_color"] == board_data["background_color"]
        assert data["user_id"] is not None  # 只检查user_id存在，不检查具体值
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_board_invalid_data(self, test_user, auth_headers):
        """测试创建看板数据验证失败"""
        # 空名称
        board_data = {"name": ""}
        response = client.post("/api/boards", json=board_data, headers=auth_headers)
        assert response.status_code == 422

        # 名称过长
        board_data = {"name": "a" * 256}
        response = client.post("/api/boards", json=board_data, headers=auth_headers)
        assert response.status_code == 422

        # 无效的颜色格式
        board_data = {"name": "Test Board", "background_color": "invalid"}
        response = client.post("/api/boards", json=board_data, headers=auth_headers)
        assert response.status_code == 422

    def test_get_user_boards(self, test_user, auth_headers):
        """测试获取用户看板列表"""
        # 先创建几个看板
        for i in range(3):
            board_data = {
                "name": f"测试看板 {i+1}",
                "description": f"这是第{i+1}个测试看板"
            }
            client.post("/api/boards", json=board_data, headers=auth_headers)

        response = client.get("/api/boards", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3

        # 验证看板数据格式
        for board in data:
            assert "id" in board
            assert "name" in board
            assert "user_id" in board
            assert board["user_id"] is not None  # 只检查存在

    def test_get_boards_with_pagination(self, test_user, auth_headers):
        """测试看板分页功能"""
        response = client.get("/api/boards?skip=0&limit=2", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2

    def test_get_board_detail(self, test_user, auth_headers):
        """测试获取看板详情"""
        # 先创建看板
        board_data = {"name": "详细测试看板", "description": "用于详情测试"}
        create_response = client.post("/api/boards", json=board_data, headers=auth_headers)
        board_id = create_response.json()["id"]

        # 获取详情
        response = client.get(f"/api/boards/{board_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == board_id
        assert data["name"] == board_data["name"]
        assert data["description"] == board_data["description"]
        assert "lists" in data
        assert isinstance(data["lists"], list)

    def test_get_board_not_found(self, test_user, auth_headers):
        """测试获取不存在的看板"""
        response = client.get("/api/boards/non_existent_board_id", headers=auth_headers)
        assert response.status_code == 404
        assert "detail" in response.json()

    def test_update_board(self, test_user, auth_headers):
        """测试更新看板"""
        # 先创建看板
        board_data = {"name": "原始看板名称", "description": "原始描述"}
        create_response = client.post("/api/boards", json=board_data, headers=auth_headers)
        board_id = create_response.json()["id"]

        # 更新看板
        update_data = {
            "name": "更新后的看板名称",
            "description": "更新后的描述",
            "background_color": "#FF5722",
            "is_archived": True
        }
        response = client.put(f"/api/boards/{board_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["background_color"] == update_data["background_color"]
        assert data["is_archived"] == update_data["is_archived"]

    def test_update_board_partial(self, test_user, auth_headers):
        """测试部分更新看板"""
        # 先创建看板
        board_data = {"name": "部分更新测试看板", "description": "原始描述"}
        create_response = client.post("/api/boards", json=board_data, headers=auth_headers)
        board_id = create_response.json()["id"]

        # 只更新名称
        update_data = {"name": "仅更新名称"}
        response = client.put(f"/api/boards/{board_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == board_data["description"]  # 描述保持不变

    def test_update_board_not_found(self, test_user, auth_headers):
        """测试更新不存在的看板"""
        update_data = {"name": "不存在的看板"}
        response = client.put("/api/boards/non_existent_board_id", json=update_data, headers=auth_headers)
        assert response.status_code == 404

    def test_delete_board(self, test_user, auth_headers):
        """测试删除看板"""
        # 先创建看板
        board_data = {"name": "待删除看板"}
        create_response = client.post("/api/boards", json=board_data, headers=auth_headers)
        board_id = create_response.json()["id"]

        # 删除看板
        response = client.delete(f"/api/boards/{board_id}", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["message"] == "看板已删除"

        # 验证看板已不存在
        get_response = client.get(f"/api/boards/{board_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_archive_board(self, test_user, auth_headers):
        """测试归档看板"""
        # 先创建看板
        board_data = {"name": "归档测试看板"}
        create_response = client.post("/api/boards", json=board_data, headers=auth_headers)
        board_id = create_response.json()["id"]

        # 归档看板
        response = client.put(f"/api/boards/{board_id}/archive", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["is_archived"] == True

        # 验证在默认列表中不包含已归档看板
        boards_response = client.get("/api/boards", headers=auth_headers)
        boards = boards_response.json()
        archived_board = next((b for b in boards if b["id"] == board_id), None)
        assert archived_board is None or archived_board["is_archived"] == False

        # 验证包含已归档看板时可以获取到
        all_boards_response = client.get("/api/boards?include_archived=true", headers=auth_headers)
        all_boards = all_boards_response.json()
        archived_board = next((b for b in all_boards if b["id"] == board_id), None)
        assert archived_board is not None
        assert archived_board["is_archived"] == True

# ===== 列表管理测试 =====

class TestListManagement:
    """列表管理API测试"""

    @pytest.fixture
    def test_board(self, test_user, auth_headers):
        """创建测试看板"""
        board_data = {"name": "列表测试看板", "description": "用于列表测试"}
        response = client.post("/api/boards", json=board_data, headers=auth_headers)
        return response.json()

    def test_create_list(self, test_board, auth_headers):
        """测试创建列表"""
        list_data = {
            "name": "待办事项",
            "description": "需要完成的任务",
            "board_id": test_board["id"],
            "position": 0
        }

        response = client.post(f"/api/boards/{test_board['id']}/lists", json=list_data, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == list_data["name"]
        assert data["description"] == list_data["description"]
        assert data["board_id"] == test_board["id"]
        assert data["position"] == list_data["position"]
        assert "id" in data

    def test_get_board_lists(self, test_board, auth_headers):
        """测试获取看板的所有列表"""
        # 先创建几个列表
        for i in range(3):
            list_data = {
                "name": f"列表 {i+1}",
                "board_id": test_board["id"],
                "position": i
            }
            client.post(f"/api/boards/{test_board['id']}/lists", json=list_data, headers=auth_headers)

        # 获取所有列表
        response = client.get(f"/api/boards/{test_board['id']}/lists", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3

        # 验证列表数据格式
        for lst in data:
            assert "id" in lst
            assert "name" in lst
            assert "board_id" in lst
            assert lst["board_id"] == test_board["id"]

    def test_update_list(self, test_board, auth_headers):
        """测试更新列表"""
        # 先创建列表
        list_data = {"name": "原始列表名称", "board_id": test_board["id"]}
        create_response = client.post(f"/api/boards/{test_board['id']}/lists", json=list_data, headers=auth_headers)
        list_id = create_response.json()["id"]

        # 更新列表
        update_data = {
            "name": "更新后的列表名称",
            "description": "新的描述",
            "position": 5,
            "is_archived": True
        }
        response = client.put(f"/api/boards/lists/{list_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["position"] == update_data["position"]
        assert data["is_archived"] == update_data["is_archived"]

    def test_delete_list(self, test_board, auth_headers):
        """测试删除列表"""
        # 先创建列表
        list_data = {"name": "待删除列表", "board_id": test_board["id"]}
        create_response = client.post(f"/api/boards/{test_board['id']}/lists", json=list_data, headers=auth_headers)
        list_id = create_response.json()["id"]

        # 删除列表
        response = client.delete(f"/api/boards/lists/{list_id}", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["message"] == "列表已删除"

        # 验证列表已从看板中移除
        lists_response = client.get(f"/api/boards/{test_board['id']}/lists", headers=auth_headers)
        lists = lists_response.json()
        deleted_list = next((l for l in lists if l["id"] == list_id), None)
        assert deleted_list is None

    def test_reorder_lists(self, test_board, auth_headers):
        """测试重新排序列表"""
        # 创建多个列表
        list_ids = []
        for i in range(3):
            list_data = {
                "name": f"列表 {i+1}",
                "board_id": test_board["id"],
                "position": i
            }
            response = client.post(f"/api/boards/{test_board['id']}/lists", json=list_data, headers=auth_headers)
            list_ids.append(response.json()["id"])

        # 重新排序：将第三个列表移到第一个位置
        # 注意：我们的重新排序API是针对单个列表的，需要逐个移动
        # 将第三个列表移到位置0
        reorder_data = {
            "new_position": 0
        }
        response = client.put(f"/api/boards/lists/{list_ids[2]}/reorder", json=reorder_data, headers=auth_headers)

        assert response.status_code == 200

        # 验证新的顺序 (第三个列表现在应该在第一个位置)
        lists_response = client.get(f"/api/boards/{test_board['id']}/lists", headers=auth_headers)
        lists = lists_response.json()
        # 第三个列表应该移动到了位置0
        assert lists[0]["id"] == list_ids[2]

# ===== 卡片管理测试 =====

class TestCardManagement:
    """卡片管理API测试"""

    @pytest.fixture
    def test_board_and_list(self, test_user, auth_headers):
        """创建测试看板和列表"""
        # 创建看板
        board_data = {"name": "卡片测试看板"}
        board_response = client.post("/api/boards", json=board_data, headers=auth_headers)
        board = board_response.json()

        # 创建列表
        list_data = {"name": "待办列表", "board_id": board["id"]}
        list_response = client.post(f"/api/boards/{board['id']}/lists", json=list_data, headers=auth_headers)
        lst = list_response.json()

        return board, lst

    def test_create_card(self, test_board_and_list, auth_headers):
        """测试创建卡片"""
        board, lst = test_board_and_list

        card_data = {
            "title": "实现用户登录功能",
            "description": "需要实现完整的用户认证系统",
            "list_id": lst["id"],
            "position": 0,
            "priority": "high",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "tags": ["前端", "认证", "重要"]
        }

        response = client.post(f"/api/boards/lists/{lst['id']}/cards", json=card_data, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == card_data["title"]
        assert data["description"] == card_data["description"]
        assert data["list_id"] == lst["id"]
        assert data["priority"] == card_data["priority"]
        assert data["position"] == card_data["position"]
        assert data["tags"] == card_data["tags"]
        assert "id" in data

    def test_get_list_cards(self, test_board_and_list, auth_headers):
        """测试获取列表的所有卡片"""
        board, lst = test_board_and_list

        # 先创建几个卡片
        for i in range(3):
            card_data = {
                "title": f"任务 {i+1}",
                "list_id": lst["id"],
                "position": i,
                "priority": "medium"
            }
            client.post(f"/api/boards/lists/{lst['id']}/cards", json=card_data, headers=auth_headers)

        # 获取所有卡片
        response = client.get(f"/api/boards/lists/{lst['id']}/cards", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3

        # 验证卡片数据格式
        for card in data:
            assert "id" in card
            assert "title" in card
            assert "list_id" in card
            assert card["list_id"] == lst["id"]

    def test_update_card(self, test_board_and_list, auth_headers):
        """测试更新卡片"""
        board, lst = test_board_and_list

        # 先创建卡片
        card_data = {"title": "原始卡片标题", "list_id": lst["id"]}
        create_response = client.post(f"/api/boards/lists/{lst['id']}/cards", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]

        # 更新卡片
        update_data = {
            "title": "更新后的卡片标题",
            "description": "添加了详细描述",
            "priority": "urgent",
            "is_completed": True,
            "due_date": (datetime.now() + timedelta(days=3)).isoformat(),
            "tags": ["更新", "紧急"]
        }
        response = client.put(f"/api/boards/cards/{card_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["priority"] == update_data["priority"]
        assert data["is_completed"] == update_data["is_completed"]
        assert data["due_date"] == update_data["due_date"]
        assert data["tags"] == update_data["tags"]

    def test_delete_card(self, test_board_and_list, auth_headers):
        """测试删除卡片"""
        board, lst = test_board_and_list

        # 先创建卡片
        card_data = {"title": "待删除卡片", "list_id": lst["id"]}
        create_response = client.post(f"/api/boards/lists/{lst['id']}/cards", json=card_data, headers=auth_headers)
        card_id = create_response.json()["id"]

        # 删除卡片
        response = client.delete(f"/api/boards/cards/{card_id}", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["message"] == "卡片已删除"

        # 验证卡片已从列表中移除
        cards_response = client.get(f"/api/boards/lists/{lst['id']}/cards", headers=auth_headers)
        cards = cards_response.json()
        deleted_card = next((c for c in cards if c["id"] == card_id), None)
        assert deleted_card is None

    def test_move_card_to_different_list(self, test_board_and_list, auth_headers):
        """测试移动卡片到其他列表"""
        board, source_list = test_board_and_list

        # 创建目标列表
        target_list_data = {"name": "已完成", "board_id": board["id"]}
        target_list_response = client.post(f"/api/boards/{board['id']}/lists", json=target_list_data, headers=auth_headers)
        target_list = target_list_response.json()

        # 先创建卡片
        card_data = {"title": "需要移动的卡片", "list_id": source_list["id"]}
        create_response = client.post(f"/api/boards/lists/{source_list['id']}/cards", json=card_data, headers=auth_headers)
        card = create_response.json()

        # 移动卡片
        move_data = {
            "source_list_id": source_list["id"],
            "target_list_id": target_list["id"],
            "new_position": 0
        }
        response = client.put(f"/api/boards/cards/{card['id']}/move", json=move_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["list_id"] == target_list["id"]

        # 验证源列表不再包含该卡片
        source_cards_response = client.get(f"/api/boards/lists/{source_list['id']}/cards", headers=auth_headers)
        source_cards = source_cards_response.json()
        moved_card = next((c for c in source_cards if c["id"] == card["id"]), None)
        assert moved_card is None

        # 验证目标列表包含该卡片
        target_cards_response = client.get(f"/api/boards/lists/{target_list['id']}/cards", headers=auth_headers)
        target_cards = target_cards_response.json()
        moved_card = next((c for c in target_cards if c["id"] == card["id"]), None)
        assert moved_card is not None

    def test_reorder_cards(self, test_board_and_list, auth_headers):
        """测试重新排序卡片"""
        board, lst = test_board_and_list

        # 创建多个卡片
        card_ids = []
        for i in range(3):
            card_data = {
                "title": f"卡片 {i+1}",
                "list_id": lst["id"],
                "position": i
            }
            response = client.post(f"/api/boards/lists/{lst['id']}/cards", json=card_data, headers=auth_headers)
            card_ids.append(response.json()["id"])

        # 重新排序：将第三个卡片移到第一个位置
        # 注意：我们的重新排序API是针对单个卡片的，需要逐个移动
        reorder_data = {
            "new_position": 0
        }
        response = client.put(f"/api/boards/cards/{card_ids[2]}/reorder", json=reorder_data, headers=auth_headers)

        assert response.status_code == 200
        updated_card = response.json()
        # 验证返回的卡片就是我们移动的卡片
        assert updated_card["id"] == card_ids[2]

        # 验证新的顺序 (第三个卡片现在应该在第一个位置)
        cards_response = client.get(f"/api/boards/lists/{lst['id']}/cards", headers=auth_headers)
        cards = cards_response.json()
        # 第三个卡片应该移动到了位置0
        assert cards[0]["id"] == card_ids[2]

# ===== 错误处理测试 =====

class TestErrorHandling:
    """错误处理测试"""

    def test_unauthorized_access(self):
        """测试未授权访问"""
        response = client.get("/api/boards")
        assert response.status_code == 403

    def test_invalid_board_id_format(self, auth_headers):
        """测试无效的看板ID格式"""
        response = client.get("/api/boards/invalid-id-format", headers=auth_headers)
        assert response.status_code in [404, 422]

    def test_create_board_with_nonexistent_user(self):
        """测试使用不存在的用户创建看板"""
        # 这个测试需要模拟不同的用户ID，可能需要修改测试设置
        pass

    def test_access_other_user_board(self, test_user, auth_headers):
        """测试访问其他用户的看板"""
        # 这个测试需要创建不同用户的看板，可能需要修改测试设置
        pass

if __name__ == "__main__":
    pytest.main([__file__, "-v"])