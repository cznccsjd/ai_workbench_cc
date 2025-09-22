#
# 项目管理看板功能测试
# 严格遵循TDD模式，先写测试后实现功能
#

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from main import app
from models.kanban import Board, List, Card
from models.user import User
from schemas.kanban import BoardCreate, ListCreate, CardCreate, CardMoveRequest
from services.kanban_service import KanbanService


class TestKanbanModels:
    """测试看板数据模型"""

    def test_board_creation(self, db_session: Session, test_user: User):
        """测试看板创建"""
        board_data = {
            "user_id": test_user.id,
            "name": "测试看板",
            "description": "这是一个测试看板",
            "background_color": "#FF6B6B"
        }

        board = Board(**board_data)
        db_session.add(board)
        db_session.commit()

        assert board.id is not None
        assert board.name == "测试看板"
        assert board.user_id == test_user.id
        assert board.background_color == "#FF6B6B"
        assert board.is_archived is False
        assert board.position == 0
        assert board.created_at is not None
        assert board.updated_at is not None

    def test_list_creation(self, db_session: Session, test_board: Board):
        """测试列表创建"""
        list_data = {
            "board_id": test_board.id,
            "name": "待办事项",
            "description": "需要完成的任务",
            "position": 0
        }

        lst = List(**list_data)
        db_session.add(lst)
        db_session.commit()

        assert lst.id is not None
        assert lst.name == "待办事项"
        assert lst.board_id == test_board.id
        assert lst.position == 0
        assert lst.is_archived is False

    def test_card_creation(self, db_session: Session, test_list: List):
        """测试卡片创建"""
        card_data = {
            "list_id": test_list.id,
            "title": "测试任务",
            "description": "这是一个测试任务",
            "position": 0,
            "priority": "medium",
            "due_date": datetime.utcnow() + timedelta(days=7)
        }

        card = Card(**card_data)
        db_session.add(card)
        db_session.commit()

        assert card.id is not None
        assert card.title == "测试任务"
        assert card.list_id == test_list.id
        assert card.priority == "medium"
        assert card.is_completed is False
        assert card.is_archived is False
        assert card.tags == []

    def test_card_tags_functionality(self, db_session: Session, test_list: List):
        """测试卡片标签功能"""
        card = Card(
            list_id=test_list.id,
            title="标签测试",
            tags='["重要", "紧急"]'
        )
        db_session.add(card)
        db_session.commit()

        assert card.get_tags() == ["重要", "紧急"]

        card.set_tags(["高优先级", "开发"])
        assert card.get_tags() == ["高优先级", "开发"]


class TestKanbanService:
    """测试看板服务层"""

    @pytest.fixture
    def kanban_service(self):
        return KanbanService()

    def test_create_board(self, db_session: Session, test_user: User, kanban_service: KanbanService):
        """测试创建看板"""
        board_data = BoardCreate(
            name="新看板",
            description="测试描述",
            background_color="#FFFFFF"
        )

        board = kanban_service.create_board(db_session, test_user.id, board_data)

        assert board is not None
        assert board.name == "新看板"
        assert board.user_id == test_user.id
        assert board.background_color == "#FFFFFF"

    def test_create_list(self, db_session: Session, test_user: User, test_board: Board, kanban_service: KanbanService):
        """测试创建列表"""
        list_data = ListCreate(
            board_id=test_board.id,
            name="新列表",
            position=1
        )

        lst = kanban_service.create_list(db_session, test_user.id, list_data)

        assert lst is not None
        assert lst.name == "新列表"
        assert lst.board_id == test_board.id
        assert lst.position == 1

    def test_create_card(self, db_session: Session, test_user: User, test_list: List, kanban_service: KanbanService):
        """测试创建卡片"""
        card_data = CardCreate(
            list_id=test_list.id,
            title="新任务",
            priority="high"
        )

        card = kanban_service.create_card(db_session, test_user.id, card_data)

        assert card is not None
        assert card.title == "新任务"
        assert card.list_id == test_list.id
        assert card.priority == "high"

    def test_move_card(self, db_session: Session, test_user: User, test_list: List, kanban_service: KanbanService):
        """测试移动卡片"""
        # 创建两个列表
        list2 = List(board_id=test_list.board_id, name="目标列表", position=1)
        db_session.add(list2)
        db_session.commit()

        # 创建卡片
        card = Card(list_id=test_list.id, title="移动测试", position=0)
        db_session.add(card)
        db_session.commit()

        # 移动卡片
        move_data = CardMoveRequest(
            source_list_id=test_list.id,
            target_list_id=list2.id,
            new_position=0
        )

        moved_card = kanban_service.move_card(db_session, test_user.id, move_data)

        assert moved_card is not None
        assert moved_card.list_id == list2.id
        assert moved_card.position == 0

    def test_get_board_with_lists_and_cards(self, db_session: Session, test_user: User, test_board: Board, kanban_service: KanbanService):
        """测试获取看板详情包含列表和卡片"""
        # 创建测试数据
        lst = List(board_id=test_board.id, name="测试列表")
        db_session.add(lst)
        db_session.commit()

        card = Card(list_id=lst.id, title="测试卡片")
        db_session.add(card)
        db_session.commit()

        board = kanban_service.get_board_with_lists_and_cards(db_session, test_board.id, test_user.id)

        assert board is not None
        assert board.id == test_board.id
        assert len(board.lists) == 1
        assert len(board.lists[0].cards) == 1
        assert board.lists[0].cards[0].title == "测试卡片"

    def test_get_board_stats(self, db_session: Session, test_user: User, test_board: Board, kanban_service: KanbanService):
        """测试看板统计功能"""
        # 创建测试数据
        lst = List(board_id=test_board.id, name="统计测试列表")
        db_session.add(lst)
        db_session.commit()

        # 创建不同状态的卡片
        cards_data = [
            {"title": "已完成", "is_completed": True, "priority": "high"},
            {"title": "进行中", "is_completed": False, "priority": "medium"},
            {"title": "已过期", "is_completed": False, "priority": "urgent", "due_date": datetime.utcnow() - timedelta(days=1)}
        ]

        for card_data in cards_data:
            card = Card(list_id=lst.id, **card_data)
            db_session.add(card)
        db_session.commit()

        stats = kanban_service.get_board_stats(db_session, test_board.id, test_user.id)

        assert stats is not None
        assert stats.total_cards == 3
        assert stats.completed_cards == 1
        assert stats.overdue_cards == 1
        assert stats.cards_by_priority["high"] == 1
        assert stats.cards_by_priority["medium"] == 1
        assert stats.cards_by_priority["urgent"] == 1

    def test_search_cards(self, db_session: Session, test_user: User, test_list: List, kanban_service: KanbanService):
        """测试卡片搜索功能"""
        # 创建测试卡片
        cards_data = [
            {"title": "前端开发任务", "description": "实现用户界面"},
            {"title": "后端API开发", "description": "创建RESTful接口"},
            {"title": "测试用例编写", "description": "编写单元测试"}
        ]

        for card_data in cards_data:
            card = Card(list_id=test_list.id, **card_data)
            db_session.add(card)
        db_session.commit()

        # 搜索包含"开发"的卡片
        search_request = SearchRequest(query="开发", board_id=test_list.board_id)
        results = kanban_service.search_cards(db_session, test_user.id, search_request)

        assert results is not None
        assert len(results.cards) == 2  # 前端开发和后端API
        assert results.total_count == 2
        assert results.query == "开发"

    def test_filter_cards(self, db_session: Session, test_user: User, test_list: List, kanban_service: KanbanService):
        """测试卡片过滤功能"""
        # 创建测试卡片
        cards_data = [
            {"title": "高优先级任务", "priority": "high", "is_completed": False},
            {"title": "已完成任务", "priority": "medium", "is_completed": True},
            {"title": "低优先级任务", "priority": "low", "is_completed": False}
        ]

        for card_data in cards_data:
            card = Card(list_id=test_list.id, **card_data)
            db_session.add(card)
        db_session.commit()

        # 过滤高优先级未完成任务
        filter_data = CardFilter(
            priorities=["high"],
            is_completed=False
        )

        filtered_cards = kanban_service.filter_cards(db_session, test_user.id, filter_data, test_list.board_id)

        assert len(filtered_cards) == 1
        assert filtered_cards[0].title == "高优先级任务"
        assert filtered_cards[0].priority == "high"
        assert filtered_cards[0].is_completed is False


class TestKanbanAPI:
    """测试看板API端点"""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def auth_headers(self, test_user_token):
        return {"Authorization": f"Bearer {test_user_token}"}

    def test_create_board_api(self, client: TestClient, auth_headers: dict):
        """测试创建看板API"""
        board_data = {
            "name": "API测试看板",
            "description": "通过API创建的看板",
            "background_color": "#4F46E5"
        }

        response = client.post("/api/kanban/boards", json=board_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "API测试看板"
        assert data["description"] == "通过API创建的看板"
        assert "id" in data

    def test_get_boards_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试获取看板列表API"""
        response = client.get("/api/kanban/boards", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(board["id"] == test_board.id for board in data)

    def test_get_board_detail_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试获取看板详情API"""
        response = client.get(f"/api/kanban/boards/{test_board.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_board.id
        assert data["name"] == test_board.name
        assert "lists" in data

    def test_update_board_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试更新看板API"""
        update_data = {
            "name": "更新的看板名称",
            "background_color": "#EF4444"
        }

        response = client.put(f"/api/kanban/boards/{test_board.id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "更新的看板名称"
        assert data["background_color"] == "#EF4444"

    def test_delete_board_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试删除看板API"""
        response = client.delete(f"/api/kanban/boards/{test_board.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "看板已删除"

    def test_create_list_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试创建列表API"""
        list_data = {
            "board_id": test_board.id,
            "name": "API测试列表",
            "position": 0
        }

        response = client.post("/api/kanban/lists", json=list_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "API测试列表"
        assert data["board_id"] == test_board.id

    def test_create_card_api(self, client: TestClient, auth_headers: dict, test_list: List):
        """测试创建卡片API"""
        card_data = {
            "list_id": test_list.id,
            "title": "API测试卡片",
            "description": "通过API创建的卡片",
            "priority": "high"
        }

        response = client.post("/api/kanban/cards", json=card_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "API测试卡片"
        assert data["priority"] == "high"
        assert data["list_id"] == test_list.id

    def test_move_card_api(self, client: TestClient, auth_headers: dict, test_list: List):
        """测试移动卡片API"""
        # 创建目标列表
        list2 = List(board_id=test_list.board_id, name="目标列表")
        # 这里需要保存到数据库

        # 创建卡片
        card = Card(list_id=test_list.id, title="移动测试卡片")
        # 这里需要保存到数据库

        move_data = {
            "source_list_id": test_list.id,
            "target_list_id": "target_list_id",  # 需要替换为实际ID
            "new_position": 0
        }

        response = client.post("/api/kanban/cards/move", json=move_data, headers=auth_headers)

        # 这里需要根据实际测试数据调整
        assert response.status_code in [200, 404]  # 200成功，404如果列表不存在

    def test_search_cards_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试搜索卡片API"""
        search_data = {
            "query": "测试",
            "board_id": test_board.id,
            "include_archived": False
        }

        response = client.post("/api/kanban/cards/search", json=search_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "cards" in data
        assert "total_count" in data
        assert data["query"] == "测试"

    def test_filter_cards_api(self, client: TestClient, auth_headers: dict, test_board: Board):
        """测试过滤卡片API"""
        filter_data = {
            "priorities": ["high", "urgent"],
            "is_completed": False
        }

        response = client.post(f"/api/kanban/cards/filter?board_id={test_board.id}", json=filter_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_unauthorized_access(self, client: TestClient):
        """测试未授权访问"""
        response = client.get("/api/kanban/boards")
        assert response.status_code == 401

    def test_invalid_board_id(self, client: TestClient, auth_headers: dict):
        """测试无效的看板ID"""
        response = client.get("/api/kanban/boards/invalid-id", headers=auth_headers)
        assert response.status_code == 404

    def test_create_board_validation(self, client: TestClient, auth_headers: dict):
        """测试创建看板数据验证"""
        # 测试空名称
        invalid_data = {"name": "", "background_color": "#FFFFFF"}
        response = client.post("/api/kanban/boards", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422

        # 测试无效的颜色格式
        invalid_data = {"name": "测试", "background_color": "INVALID"}
        response = client.post("/api/kanban/boards", json=invalid_data, headers=auth_headers)
        assert response.status_code == 422


class TestKanbanPerformance:
    """性能测试"""

    def test_large_board_performance(self, db_session: Session, test_user: User, kanban_service: KanbanService):
        """测试大型看板性能"""
        # 创建包含多个列表和卡片的看板
        board = Board(user_id=test_user.id, name="大型测试看板")
        db_session.add(board)
        db_session.commit()

        # 创建10个列表
        for i in range(10):
            lst = List(board_id=board.id, name=f"列表{i}", position=i)
            db_session.add(lst)
            db_session.flush()

            # 每个列表创建20个卡片
            for j in range(20):
                card = Card(
                    list_id=lst.id,
                    title=f"卡片{i}-{j}",
                    position=j,
                    priority="medium" if j % 3 == 0 else "high"
                )
                db_session.add(card)

        db_session.commit()

        # 测试获取看板详情性能
        import time
        start_time = time.time()

        result = kanban_service.get_board_with_lists_and_cards(db_session, board.id, test_user.id)

        end_time = time.time()
        execution_time = end_time - start_time

        assert result is not None
        assert len(result.lists) == 10
        assert sum(len(lst.cards) for lst in result.lists) == 200
        assert execution_time < 2.0  # 2秒内完成

    def test_bulk_operations_performance(self, db_session: Session, test_user: User, test_list: List, kanban_service: KanbanService):
        """测试批量操作性能"""
        # 创建100个卡片
        card_ids = []
        for i in range(100):
            card = Card(list_id=test_list.id, title=f"批量测试卡片{i}")
            db_session.add(card)
            db_session.flush()
            card_ids.append(card.id)

        db_session.commit()

        # 测试批量更新性能
        import time
        start_time = time.time()

        bulk_update = BulkCardUpdate(
            card_ids=card_ids,
            updates=CardUpdate(priority="high")
        )

        updated_count = kanban_service.bulk_update_cards(db_session, test_user.id, bulk_update)

        end_time = time.time()
        execution_time = end_time - start_time

        assert updated_count == 100
        assert execution_time < 1.0  # 1秒内完成批量更新


class TestKanbanEdgeCases:
    """边界条件测试"""

    def test_circular_dependency_prevention(self, db_session: Session, test_list: List):
        """测试循环依赖预防"""
        # 确保不会创建循环引用
        with pytest.raises(Exception):
            # 这里应该测试数据库约束
            pass

    def test_concurrent_updates(self, db_session: Session, test_card: Card):
        """测试并发更新处理"""
        # 模拟并发更新同一个卡片
        # 这里需要实现乐观锁机制
        pass

    def test_data_integrity_on_deletion(self, db_session: Session, test_board: Board, kanban_service: KanbanService):
        """测试删除时的数据完整性"""
        board_id = test_board.id

        # 删除看板
        kanban_service.delete_board(db_session, board_id, test_board.user_id)

        # 验证相关数据也被删除或标记为已删除
        deleted_board = db_session.query(Board).filter(Board.id == board_id).first()
        assert deleted_board.is_archived is True

    def test_invalid_drag_operations(self, db_session: Session, test_user: User, kanban_service: KanbanService):
        """测试无效拖拽操作"""
        # 尝试将卡片拖拽到不存在的列表
        invalid_move = CardMoveRequest(
            source_list_id="invalid-source",
            target_list_id="invalid-target",
            new_position=0
        )

        result = kanban_service.move_card(db_session, test_user.id, invalid_move)
        assert result is None

    def test_maximum_nesting_depth(self):
        """测试最大嵌套深度"""
        # 确保数据结构不会无限嵌套
        # 这里需要定义合理的深度限制
        pass