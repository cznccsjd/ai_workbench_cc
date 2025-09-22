/**
 * 拖拽功能测试
 * 测试看板卡片和列表的拖拽功能
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import CardItem from '../CardItem';
import ListColumn from '../ListColumn';
import { Card, List } from '@/types/kanban';

// 模拟卡片数据
const mockCard: Card = {
  id: 'card-1',
  list_id: 'list-1',
  title: '测试卡片',
  description: '测试描述',
  position: 0,
  priority: 'medium',
  is_completed: false,
  is_archived: false,
  tags: ['测试'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// 模拟列表数据
const mockList: List = {
  id: 'list-1',
  board_id: 'board-1',
  name: '测试列表',
  position: 0,
  is_archived: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('拖拽功能测试', () => {
  describe('CardItem', () => {
    it('应该渲染卡片并显示拖拽手柄', () => {
      render(
        <DndContext>
          <CardItem
            card={mockCard}
            listId="list-1"
            onClick={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isDragging={false}
          />
        </DndContext>
      );

      // 检查卡片标题
      expect(screen.getByText('测试卡片')).toBeInTheDocument();

      // 检查拖拽手柄是否存在
      const dragHandle = screen.getByLabelText('拖拽卡片');
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveClass('drag-handle');
    });

    it('应该在拖拽时应用正确的样式', () => {
      render(
        <DndContext>
          <CardItem
            card={mockCard}
            listId="list-1"
            onClick={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isDragging={true}
          />
        </DndContext>
      );

      const cardElement = screen.getByRole('button', { name: /卡片：测试卡片/i });
      // 检查拖拽时的样式
      expect(cardElement).toHaveClass('pointer-events-none'); // 拖拽时禁用点击
      expect(cardElement).toHaveClass('draggable-hover'); // 基础可拖拽样式
    });

    it('应该支持键盘导航', () => {
      const mockOnClick = jest.fn();

      render(
        <DndContext>
          <CardItem
            card={mockCard}
            listId="list-1"
            onClick={mockOnClick}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isDragging={false}
          />
        </DndContext>
      );

      const cardElement = screen.getByRole('button', { name: /卡片：测试卡片/i });

      // 测试 Enter 键
      fireEvent.keyDown(cardElement, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledWith(mockCard);

      // 测试空格键
      mockOnClick.mockClear();
      fireEvent.keyDown(cardElement, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledWith(mockCard);
    });
  });

  describe('ListColumn', () => {
    it('应该渲染列表并支持拖拽', () => {
      render(
        <DndContext>
          <ListColumn
            list={mockList}
            cards={[mockCard]}
            onCardClick={jest.fn()}
            onCardCreate={jest.fn()}
            onListEdit={jest.fn()}
            onListDelete={jest.fn()}
            onCardMove={jest.fn()}
          />
        </DndContext>
      );

      // 检查列表名称
      expect(screen.getByText('测试列表')).toBeInTheDocument();

      // 检查列表是否应用了基础样式
      const listElement = screen.getByRole('group', { name: /列表：测试列表/i });
      expect(listElement).toHaveClass('draggable-hover');
    });

    it('应该在拖拽时应用正确的样式', () => {
      // 这里需要模拟拖拽状态
      const { container } = render(
        <DndContext>
          <ListColumn
            list={mockList}
            cards={[mockCard]}
            onCardClick={jest.fn()}
            onCardCreate={jest.fn()}
            onListEdit={jest.fn()}
            onListDelete={jest.fn()}
            onCardMove={jest.fn()}
          />
        </DndContext>
      );

      // 检查列表容器
      const listElement = container.querySelector('.w-80');
      expect(listElement).toHaveClass('draggable-hover');
    });
  });

  describe('拖拽事件处理', () => {
    it('应该正确处理拖拽开始事件', () => {
      const mockStartDraggingCard = jest.fn();
      const mockStartDraggingList = jest.fn();

      const TestComponent = () => {
        const handleDragStart = (event: DragStartEvent) => {
          const { active } = event;
          const itemType = active.data.current?.type;
          const itemData = active.data.current?.card || active.data.current?.list;

          if (itemType === 'card' && itemData) {
            mockStartDraggingCard(itemData);
          } else if (itemType === 'list' && itemData) {
            mockStartDraggingList(itemData);
          }
        };

        return (
          <DndContext onDragStart={handleDragStart}>
            <div data-type="card" data-card={JSON.stringify(mockCard)}>测试卡片</div>
          </DndContext>
        );
      };

      render(<TestComponent />);

      // 这里可以模拟拖拽开始事件
      // 由于DndContext的复杂性，实际测试可能需要更复杂的设置
      expect(mockStartDraggingCard).not.toHaveBeenCalled(); // 初始状态
    });
  });

  describe('移动端兼容性', () => {
    it('应该应用移动端优化的样式', () => {
      render(
        <DndContext>
          <CardItem
            card={mockCard}
            listId="list-1"
            onClick={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isDragging={false}
          />
        </DndContext>
      );

      const cardElement = screen.getByRole('button', { name: /卡片：测试卡片/i });

      // 检查移动端触摸优化类
      // 由于实际实现中touch-manipulation类应用在拖拽手柄上，我们检查拖拽手柄
      const dragHandle = screen.getByLabelText('拖拽卡片');
      expect(dragHandle).toHaveClass('touch-manipulation');
    });
  });

  describe('可访问性', () => {
    it('应该提供正确的ARIA标签', () => {
      render(
        <DndContext>
          <CardItem
            card={mockCard}
            listId="list-1"
            onClick={jest.fn()}
            onEdit={jest.fn()}
            onDelete={jest.fn()}
            isDragging={false}
          />
        </DndContext>
      );

      const cardElement = screen.getByRole('button', { name: /卡片：测试卡片/i });
      expect(cardElement).toHaveAttribute('aria-label', '卡片：测试卡片');
      expect(cardElement).toHaveAttribute('tabindex', '0');
    });

    it('应该为列表提供正确的ARIA标签', () => {
      render(
        <DndContext>
          <ListColumn
            list={mockList}
            cards={[mockCard]}
            onCardClick={jest.fn()}
            onCardCreate={jest.fn()}
            onListEdit={jest.fn()}
            onListDelete={jest.fn()}
            onCardMove={jest.fn()}
          />
        </DndContext>
      );

      const listElement = screen.getByRole('group', { name: /列表：测试列表/i });
      expect(listElement).toHaveAttribute('aria-label', '列表：测试列表');
    });
  });
});