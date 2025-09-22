/**
 * 看板主组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KanbanBoard from '../KanbanBoard';
import { useKanbanStore } from '@/stores/kanbanStore';
import * as apiClient from '@/lib/apiClient';

// Mock API客户端
jest.mock('@/lib/apiClient');

// Mock Zustand store
const mockStore = {
  boards: [
    {
      id: 'board-1',
      name: '测试看板',
      lists: [
        {
          id: 'list-1',
          name: '待办',
          cards: [
            {
              id: 'card-1',
              title: '测试卡片',
              description: '测试描述',
              priority: 'medium',
              is_completed: false,
              list_id: 'list-1',
              tags: []
            }
          ]
        }
      ]
    }
  ],
  currentBoardId: 'board-1',
  isLoading: false,
  error: null,
  fetchBoard: jest.fn(),
  createList: jest.fn(),
  createCard: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
  moveCard: jest.fn()
};

jest.mock('@/stores/kanbanStore', () => ({
  useKanbanStore: jest.fn(() => mockStore)
}));

// Mock拖拽Hook - 已删除，直接在组件中实现

describe('KanbanBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确渲染看板组件', () => {
    render(<KanbanBoard boardId="board-1" />);

    expect(screen.getByText('测试看板')).toBeInTheDocument();
    expect(screen.getByText('待办')).toBeInTheDocument();
    expect(screen.getByText('测试卡片')).toBeInTheDocument();
  });

  it('应该获取看板数据', () => {
    render(<KanbanBoard boardId="board-1" />);

    expect(mockStore.fetchBoard).toHaveBeenCalledWith('board-1');
  });

  it('应该处理卡片点击事件', () => {
    render(<KanbanBoard boardId="board-1" />);

    const cardElement = screen.getByText('测试卡片');
    fireEvent.click(cardElement);

    // 验证卡片模态框是否被触发
    waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('应该处理创建列表', () => {
    // Mock prompt
    global.prompt = jest.fn(() => '新列表');

    render(<KanbanBoard boardId="board-1" />);

    const addListButton = screen.getByText('添加列表');
    fireEvent.click(addListButton);

    expect(prompt).toHaveBeenCalledWith('请输入列表名称:');
    expect(mockStore.createList).toHaveBeenCalledWith({
      board_id: 'board-1',
      name: '新列表',
      position: 1
    });
  });

  it('应该显示加载状态', () => {
    mockStore.isLoading = true;

    render(<KanbanBoard boardId="board-1" />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该显示错误状态', () => {
    mockStore.isLoading = false;
    mockStore.error = '加载失败';

    render(<KanbanBoard boardId="board-1" />);

    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('应该处理卡片模态框关闭', () => {
    render(<KanbanBoard boardId="board-1" />);

    // 打开模态框
    const cardElement = screen.getByText('测试卡片');
    fireEvent.click(cardElement);

    // 关闭模态框
    const closeButton = screen.getByLabelText('关闭');
    fireEvent.click(closeButton);

    waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('应该处理卡片保存', async () => {
    const updatedCard = { title: '更新的卡片' };
    mockStore.updateCard.mockResolvedValueOnce(updatedCard);

    render(<KanbanBoard boardId="board-1" />);

    // 打开卡片编辑
    const editButton = screen.getByLabelText('编辑卡片');
    fireEvent.click(editButton);

    // 保存更改
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockStore.updateCard).toHaveBeenCalled();
    });
  });

  it('应该处理卡片删除', async () => {
    mockStore.deleteCard.mockResolvedValueOnce(true);

    render(<KanbanBoard boardId="board-1" />);

    // 打开卡片详情
    const cardElement = screen.getByText('测试卡片');
    fireEvent.click(cardElement);

    // 删除卡片
    const deleteButton = screen.getByText('删除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockStore.deleteCard).toHaveBeenCalledWith('card-1');
    });
  });

  it('应该处理看板不存在的情况', () => {
    mockStore.boards = [];

    render(<KanbanBoard boardId="non-existent" />);

    expect(screen.getByText('看板不存在')).toBeInTheDocument();
  });

  it('应该响应式布局', () => {
    render(<KanbanBoard boardId="board-1" />);

    const boardElement = screen.getByTestId('kanban-board');
    expect(boardElement).toHaveClass('flex', 'flex-col', 'h-full');
  });

  it('应该支持键盘导航', () => {
    render(<KanbanBoard boardId="board-1" />);

    const cardElement = screen.getByText('测试卡片');
    cardElement.focus();

    // 测试Enter键打开卡片
    fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });

    waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('应该处理拖拽事件', () => {
    const mockDragHandlers = {
      handleDragStart: jest.fn(),
      handleDragEnd: jest.fn()
    };

    jest.mocked(useKanbanDrag).mockReturnValue({
      ...jest.mocked(useKanbanDrag)(),
      ...mockDragHandlers
    });

    render(<KanbanBoard boardId="board-1" />);

    // 这里可以添加更详细的拖拽测试
    expect(screen.getByText('拖拽遮罩')).toBeInTheDocument();
  });

  it('应该正确处理权限验证', () => {
    // Mock未授权状态
    mockStore.error = '未授权访问';

    render(<KanbanBoard boardId="board-1" />);

    expect(screen.getByText('未授权访问')).toBeInTheDocument();
  });

  it('应该处理网络错误', async () => {
    mockStore.fetchBoard.mockRejectedValueOnce(new Error('网络错误'));

    render(<KanbanBoard boardId="board-1" />);

    await waitFor(() => {
      expect(mockStore.setError).toHaveBeenCalledWith('网络错误');
    });
  });

  it('应该支持自定义主题', () => {
    render(<KanbanBoard boardId="board-1" />);

    const boardElement = screen.getByTestId('kanban-board');
    expect(boardElement).toHaveClass('bg-gray-50');
  });

  it('应该正确处理批量操作', async () => {
    mockStore.bulkUpdateCards = jest.fn().mockResolvedValueOnce(5);

    render(<KanbanBoard boardId="board-1" />);

    // 这里可以添加批量选择的UI测试
    const bulkUpdateButton = screen.getByText('批量更新');
    fireEvent.click(bulkUpdateButton);

    await waitFor(() => {
      expect(mockStore.bulkUpdateCards).toHaveBeenCalled();
    });
  });
});