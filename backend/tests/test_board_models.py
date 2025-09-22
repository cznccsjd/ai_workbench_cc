#
# 项目管理看板数据库模型测试
# 测试Board、List、Card三个模型的功能
#

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.kanban import Board, List, Card
from models.user import User


class TestBoardModels:
    """测试看板数据库模型"""

    def test_create_board(self, db_session: Session, create_test_user):
        """测试创建看板"""
        user = create_test_user(db_session)

        board = Board(
            user_id=user.id,
            name="项目看板",
            description="这是一个测试看板",
            background_color="#FF6B6B",
            position=1
        )

        db_session.add(board)
        db_session.commit()
        db_session.refresh(board)

        assert board.id is not None
        assert board.user_id == user.id
        assert board.name == "项目看板"
        assert board.description == "这是一个测试看板"
        assert board.background_color == "#FF6B6B"
        assert board.is_archived is False
        assert board.position == 1
        assert board.created_at is not None
        assert board.updated_at is not None

    def test_create_board_with_defaults(self, db_session: Session, create_test_user):
        """测试创建看板使用默认值"""
        user = create_test_user(db_session)

        board = Board(
            user_id=user.id,
            name="默认看板"
        )

        db_session.add(board)
        db_session.commit()
        db_session.refresh(board)

        assert board.background_color == "#FFFFFF"  # 默认背景色
        assert board.is_archived is False
        assert board.position == 0  # 默认位置

    def test_board_archiving(self, db_session: Session, create_test_user):
        """测试看板归档功能"""
        user = create_test_user(db_session)

        board = Board(
            user_id=user.id,
            name="归档测试看板",
            is_archived=False
        )

        db_session.add(board)
        db_session.commit()

        # 归档看板
        board.is_archived = True
        db_session.commit()

        assert board.is_archived is True

    def test_create_list(self, db_session: Session, create_test_user):
        """测试创建列表"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(
            board_id=board.id,
            name="待办事项",
            description="需要完成的任务",
            position=1
        )

        db_session.add(lst)
        db_session.commit()
        db_session.refresh(lst)

        assert lst.id is not None
        assert lst.board_id == board.id
        assert lst.name == "待办事项"
        assert lst.description == "需要完成的任务"
        assert lst.position == 1
        assert lst.is_archived is False
        assert lst.created_at is not None
        assert lst.updated_at is not None

    def test_create_list_with_defaults(self, db_session: Session, create_test_user):
        """测试创建列表使用默认值"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(
            board_id=board.id,
            name="默认列表"
        )

        db_session.add(lst)
        db_session.commit()
        db_session.refresh(lst)

        assert lst.position == 0  # 默认位置
        assert lst.is_archived is False

    def test_create_card(self, db_session: Session, create_test_user):
        """测试创建卡片"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        card = Card(
            list_id=lst.id,
            title="完成API开发",
            description="完成后端API接口开发",
            position=1,
            priority="high",
            due_date=datetime.now() + timedelta(days=7),
            color="#FF6B6B"
        )

        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)

        assert card.id is not None
        assert card.list_id == lst.id
        assert card.title == "完成API开发"
        assert card.description == "完成后端API接口开发"
        assert card.position == 1
        assert card.priority == "high"
        assert card.due_date is not None
        assert card.color == "#FF6B6B"
        assert card.is_archived is False
        assert card.created_at is not None
        assert card.updated_at is not None

    def test_create_card_with_defaults(self, db_session: Session, create_test_user):
        """测试创建卡片使用默认值"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        card = Card(
            list_id=lst.id,
            title="默认卡片"
        )

        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)

        assert card.priority == "medium"  # 默认优先级
        assert card.position == 0  # 默认位置
        assert card.is_archived is False
        assert card.is_completed is False

    def test_board_to_dict(self, db_session: Session, create_test_user):
        """测试看板字典转换"""
        user = create_test_user(db_session)
        board = Board(
            user_id=user.id,
            name="测试看板",
            description="测试描述",
            background_color="#FF6B6B",
            position=1
        )
        db_session.add(board)
        db_session.commit()

        board_dict = board.to_dict()

        assert board_dict["id"] == board.id
        assert board_dict["name"] == "测试看板"
        assert board_dict["description"] == "测试描述"
        assert board_dict["background_color"] == "#FF6B6B"
        assert board_dict["is_archived"] is False
        assert board_dict["position"] == 1
        assert board_dict["created_at"] is not None
        assert board_dict["updated_at"] is not None
        assert "lists" in board_dict

    def test_list_to_dict(self, db_session: Session, create_test_user):
        """测试列表字典转换"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(
            board_id=board.id,
            name="测试列表",
            description="列表描述",
            position=1
        )
        db_session.add(lst)
        db_session.commit()

        list_dict = lst.to_dict()

        assert list_dict["id"] == lst.id
        assert list_dict["board_id"] == board.id
        assert list_dict["name"] == "测试列表"
        assert list_dict["description"] == "列表描述"
        assert list_dict["position"] == 1
        assert list_dict["is_archived"] is False
        assert list_dict["created_at"] is not None
        assert list_dict["updated_at"] is not None
        assert "cards" in list_dict

    def test_card_to_dict(self, db_session: Session, create_test_user):
        """测试卡片字典转换"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        card = Card(
            list_id=lst.id,
            title="测试卡片",
            description="卡片描述",
            position=1,
            priority="high",
            due_date=datetime.now() + timedelta(days=7),
            color="#FF6B6B"
        )
        db_session.add(card)
        db_session.commit()

        card_dict = card.to_dict()

        assert card_dict["id"] == card.id
        assert card_dict["list_id"] == lst.id
        assert card_dict["title"] == "测试卡片"
        assert card_dict["description"] == "卡片描述"
        assert card_dict["position"] == 1
        assert card_dict["priority"] == "high"
        assert card_dict["due_date"] is not None
        assert card_dict["color"] == "#FF6B6B"
        assert card_dict["is_archived"] is False
        assert card_dict["created_at"] is not None
        assert card_dict["updated_at"] is not None

    def test_card_tags_functionality(self, db_session: Session, create_test_user):
        """测试卡片标签功能"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        card = Card(
            list_id=lst.id,
            title="测试卡片",
            tags='["前端", "Vue.js", "UI设计"]'
        )
        db_session.add(card)
        db_session.commit()

        # 测试获取标签
        tags = card.get_tags()
        assert tags == ["前端", "Vue.js", "UI设计"]

        # 测试设置标签
        card.set_tags(["JavaScript", "React"])
        db_session.commit()
        assert card.get_tags() == ["JavaScript", "React"]

        # 测试空标签
        card.set_tags([])
        db_session.commit()
        assert card.get_tags() == []

    def test_user_board_relationship(self, db_session: Session, create_test_user):
        """测试用户与看板的关联关系"""
        user = create_test_user(db_session)

        # 创建多个看板
        board1 = Board(user_id=user.id, name="看板1", position=1)
        board2 = Board(user_id=user.id, name="看板2", position=2)
        db_session.add_all([board1, board2])
        db_session.commit()

        # 验证关联
        assert len(user.boards) == 2
        assert user.boards[0].name == "看板1"
        assert user.boards[1].name == "看板2"

    def test_board_list_relationship(self, db_session: Session, create_test_user):
        """测试看板与列表的关联关系"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        # 创建多个列表
        list1 = List(board_id=board.id, name="待办事项", position=1)
        list2 = List(board_id=board.id, name="进行中", position=2)
        list3 = List(board_id=board.id, name="已完成", position=3)
        db_session.add_all([list1, list2, list3])
        db_session.commit()

        # 验证关联
        assert len(board.lists) == 3
        assert board.lists[0].name == "待办事项"
        assert board.lists[1].name == "进行中"
        assert board.lists[2].name == "已完成"

    def test_list_card_relationship(self, db_session: Session, create_test_user):
        """测试列表与卡片的关联关系"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        # 创建多个卡片
        card1 = Card(list_id=lst.id, title="任务1", position=1)
        card2 = Card(list_id=lst.id, title="任务2", position=2)
        card3 = Card(list_id=lst.id, title="任务3", position=3)
        db_session.add_all([card1, card2, card3])
        db_session.commit()

        # 验证关联
        assert len(lst.cards) == 3
        assert lst.cards[0].title == "任务1"
        assert lst.cards[1].title == "任务2"
        assert lst.cards[2].title == "任务3"

    def test_cascade_delete_board(self, db_session: Session, create_test_user):
        """测试级联删除看板"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        # 创建列表和卡片
        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        card = Card(list_id=lst.id, title="测试卡片")
        db_session.add(card)
        db_session.commit()

        # 删除看板
        db_session.delete(board)
        db_session.commit()

        # 验证级联删除
        assert db_session.query(Board).filter_by(id=board.id).first() is None
        assert db_session.query(List).filter_by(id=lst.id).first() is None
        assert db_session.query(Card).filter_by(id=card.id).first() is None

    def test_cascade_delete_list(self, db_session: Session, create_test_user):
        """测试级联删除列表"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        # 创建卡片
        card1 = Card(list_id=lst.id, title="卡片1")
        card2 = Card(list_id=lst.id, title="卡片2")
        db_session.add_all([card1, card2])
        db_session.commit()

        # 删除列表
        db_session.delete(lst)
        db_session.commit()

        # 验证级联删除
        assert db_session.query(List).filter_by(id=lst.id).first() is None
        assert db_session.query(Card).filter_by(id=card1.id).first() is None
        assert db_session.query(Card).filter_by(id=card2.id).first() is None
        # 看板应该仍然存在
        assert db_session.query(Board).filter_by(id=board.id).first() is not None

    def test_board_position_ordering(self, db_session: Session, create_test_user):
        """测试看板位置排序"""
        user = create_test_user(db_session)

        # 创建不同位置的看板
        board1 = Board(user_id=user.id, name="看板1", position=3)
        board2 = Board(user_id=user.id, name="看板2", position=1)
        board3 = Board(user_id=user.id, name="看板3", position=2)
        db_session.add_all([board1, board2, board3])
        db_session.commit()

        # 查询用户的看板，应该按位置排序
        boards = db_session.query(Board).filter_by(user_id=user.id).order_by(Board.position).all()

        assert len(boards) == 3
        assert boards[0].name == "看板2"  # position=1
        assert boards[1].name == "看板3"  # position=2
        assert boards[2].name == "看板1"  # position=3

    def test_list_position_ordering(self, db_session: Session, create_test_user):
        """测试列表位置排序"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        # 创建不同位置的列表
        list1 = List(board_id=board.id, name="列表1", position=3)
        list2 = List(board_id=board.id, name="列表2", position=1)
        list3 = List(board_id=board.id, name="列表3", position=2)
        db_session.add_all([list1, list2, list3])
        db_session.commit()

        # 查询看板的列表，应该按位置排序
        lists = db_session.query(List).filter_by(board_id=board.id).order_by(List.position).all()

        assert len(lists) == 3
        assert lists[0].name == "列表2"  # position=1
        assert lists[1].name == "列表3"  # position=2
        assert lists[2].name == "列表1"  # position=3

    def test_card_position_ordering(self, db_session: Session, create_test_user):
        """测试卡片位置排序"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        # 创建不同位置的卡片
        card1 = Card(list_id=lst.id, title="卡片1", position=3)
        card2 = Card(list_id=lst.id, title="卡片2", position=1)
        card3 = Card(list_id=lst.id, title="卡片3", position=2)
        db_session.add_all([card1, card2, card3])
        db_session.commit()

        # 查询列表的卡片，应该按位置排序
        cards = db_session.query(Card).filter_by(list_id=lst.id).order_by(Card.position).all()

        assert len(cards) == 3
        assert cards[0].title == "卡片2"  # position=1
        assert cards[1].title == "卡片3"  # position=2
        assert cards[2].title == "卡片1"  # position=3

    def test_card_priority_values(self, db_session: Session, create_test_user):
        """测试卡片优先级值"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        # 测试不同优先级
        priorities = ["low", "medium", "high", "urgent"]
        for priority in priorities:
            card = Card(list_id=lst.id, title=f"{priority}优先级任务", priority=priority)
            db_session.add(card)

        db_session.commit()

        # 验证所有优先级都被正确保存
        cards = db_session.query(Card).filter_by(list_id=lst.id).all()
        saved_priorities = [card.priority for card in cards]
        assert set(saved_priorities) == set(priorities)

    def test_card_due_date_indexing(self, db_session: Session, create_test_user):
        """测试卡片截止日期索引"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        # 创建有截止日期的卡片
        due_date = datetime.now() + timedelta(days=7)
        card = Card(
            list_id=lst.id,
            title="有截止日期的任务",
            due_date=due_date
        )
        db_session.add(card)
        db_session.commit()

        # 按截止日期查询应该能正常工作
        cards_with_due_date = db_session.query(Card).filter(
            Card.due_date.isnot(None)
        ).all()

        assert len(cards_with_due_date) == 1
        assert cards_with_due_date[0].title == "有截止日期的任务"

    def test_model_repr_methods(self, db_session: Session, create_test_user):
        """测试模型的__repr__方法"""
        user = create_test_user(db_session)
        board = Board(user_id=user.id, name="测试看板")
        db_session.add(board)
        db_session.commit()

        lst = List(board_id=board.id, name="待办事项")
        db_session.add(lst)
        db_session.commit()

        card = Card(list_id=lst.id, title="测试卡片")
        db_session.add(card)
        db_session.commit()

        # 测试字符串表示
        assert "Board" in repr(board)
        assert board.id in repr(board)
        assert board.name in repr(board)

        assert "List" in repr(lst)
        assert lst.id in repr(lst)
        assert lst.name in repr(lst)

        assert "Card" in repr(card)
        assert card.id in repr(card)
        assert card.title in repr(card)


if __name__ == "__main__":
    pytest.main([__file__])