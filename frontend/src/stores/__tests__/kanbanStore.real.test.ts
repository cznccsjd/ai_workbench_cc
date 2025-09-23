/**
 * 实际 kanbanStore 实现的完整测试
 * 测试真实的 Zustand store 实现和所有看板管理功能
 */

import { act, renderHook } from '@testing-library/react';
import { useKanbanStore } from '../kanbanStore';
import { Board, List, Card, BoardCreate, ListCreate, CardCreate } from '@/types/kanban';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

// Mock data
const mockBoard: Board = {
  id: 'board-1',
  title: '测试看板',
  description: '测试看板描述',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  lists: []
};

const mockList: List = {
  id: 'list-1',
  title: '待办',
  board_id: 'board-1',
  position: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  cards: []
};

const mockCard: Card = {
  id: 'card-1',
  title: '测试卡片',
  description: '测试卡片描述',
  list_id: 'list-1',
  position: 0,
  priority: 'medium',
  tags: ['测试'],
  is_completed: false,
  due_date: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};

describe('kanbanStore Real Implementation', () => {
  beforeEach(() => {
    // 重置 store 状态
    const store = useKanbanStore.getState();
    store.boards = [];
    store.currentBoardId = null;
    store.isLoading = false;
    store.isDragging = false;
    store.error = null;
    store.searchQuery = '';
    store.filterPriority = 'all';
    store.filterCompleted = null;
    store.draggedCard = null;
    store.draggedList = null;
    store.dragOverListId = null;
    store.draggedCardOriginalListId = null;
    store.draggedListOriginalPosition = null;
    store.dragHistory = [];

    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useKanbanStore());

      expect(result.current.boards).toEqual([]);
      expect(result.current.currentBoardId).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isDragging).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.filterPriority).toBe('all');
      expect(result.current.filterCompleted).toBe(null);
      expect(result.current.draggedCard).toBe(null);
      expect(result.current.draggedList).toBe(null);
      expect(result.current.dragOverListId).toBe(null);
      expect(result.current.draggedCardOriginalListId).toBe(null);
      expect(result.current.draggedListOriginalPosition).toBe(null);
      expect(result.current.dragHistory).toEqual([]);
    });
  });

  describe('Board Management', () => {
    describe('fetchBoards', () => {
      it('should fetch boards successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());
        const mockBoards = [mockBoard];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBoards)
        });

        await act(async () => {
          await result.current.fetchBoards();
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/boards');
        expect(result.current.boards).toEqual(mockBoards);
        expect(result.current.isLoading).toBe(false);
      });

      it('should handle fetch error', async () => {
        const { result } = renderHook(() => useKanbanStore());

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        });

        await act(async () => {
          try {
            await result.current.fetchBoards();
          } catch (error) {
            // 期望抛出错误
          }
        });

        expect(result.current.error).toBe('获取看板失败');
        expect(result.current.isLoading).toBe(false);
      });

      it('should set loading state during fetch', async () => {
        const { result } = renderHook(() => useKanbanStore());

        mockFetch.mockImplementation(() =>
          new Promise(resolve => {
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve([])
            }), 100);
          })
        );

        let loadingDuringFetch = false;
        const fetchPromise = act(async () => {
          const promise = result.current.fetchBoards();
          loadingDuringFetch = result.current.isLoading;
          await promise;
        });

        await fetchPromise;
        expect(loadingDuringFetch).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    describe('fetchBoard', () => {
      it('should fetch single board successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置一些初始数据
        act(() => {
          result.current.boards = [{ ...mockBoard, lists: [] }];
        });

        const updatedBoard = { ...mockBoard, lists: [mockList] };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedBoard)
        });

        await act(async () => {
          await result.current.fetchBoard('board-1');
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/boards/board-1');
        expect(result.current.boards[0]).toEqual(updatedBoard);
      });
    });

    describe('createBoard', () => {
      it('should create board successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());
        const boardData: BoardCreate = {
          title: '新看板',
          description: '新看板描述'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBoard)
        });

        let createdBoard: Board | null = null;
        await act(async () => {
          createdBoard = await result.current.createBoard(boardData);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(boardData)
        });
        expect(result.current.boards).toHaveLength(1);
        expect(result.current.boards[0]).toEqual(mockBoard);
        expect(createdBoard).toEqual(mockBoard);
      });

      it('should handle create board error', async () => {
        const { result } = renderHook(() => useKanbanStore());

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400
        });

        await act(async () => {
          try {
            await result.current.createBoard({ title: '测试' });
          } catch (error) {
            // 期望抛出错误
          }
        });

        expect(result.current.error).toBe('创建看板失败');
      });
    });

    describe('updateBoard', () => {
      it('should update board successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置初始数据
        act(() => {
          result.current.boards = [mockBoard];
        });

        const updatedBoard = { ...mockBoard, title: '更新后的看板' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedBoard)
        });

        await act(async () => {
          await result.current.updateBoard('board-1', { title: '更新后的看板' });
        });

        expect(result.current.boards[0].title).toBe('更新后的看板');
      });
    });

    describe('deleteBoard', () => {
      it('should delete board successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置初始数据
        act(() => {
          result.current.boards = [mockBoard];
          result.current.currentBoardId = 'board-1';
        });

        mockFetch.mockResolvedValueOnce({
          ok: true
        });

        await act(async () => {
          await result.current.deleteBoard('board-1');
        });

        expect(result.current.boards).toHaveLength(0);
        expect(result.current.currentBoardId).toBe(null);
      });

      it('should not clear currentBoardId when deleting different board', async () => {
        const { result } = renderHook(() => useKanbanStore());

        const board2 = { ...mockBoard, id: 'board-2' };
        act(() => {
          result.current.boards = [mockBoard, board2];
          result.current.currentBoardId = 'board-1';
        });

        mockFetch.mockResolvedValueOnce({
          ok: true
        });

        await act(async () => {
          await result.current.deleteBoard('board-2');
        });

        expect(result.current.boards).toHaveLength(1);
        expect(result.current.currentBoardId).toBe('board-1');
      });
    });

    describe('setCurrentBoard', () => {
      it('should set current board id', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.setCurrentBoard('board-1');
        });

        expect(result.current.currentBoardId).toBe('board-1');
      });
    });
  });

  describe('List Management', () => {
    describe('createList', () => {
      it('should create list successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置看板数据
        act(() => {
          result.current.boards = [{ ...mockBoard, lists: [] }];
        });

        const listData: ListCreate = {
          title: '新列表',
          board_id: 'board-1'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockList)
        });

        await act(async () => {
          await result.current.createList(listData);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listData)
        });
        expect(result.current.boards[0].lists).toHaveLength(1);
        expect(result.current.boards[0].lists![0]).toEqual(mockList);
      });
    });

    describe('updateList', () => {
      it('should update list successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置数据
        act(() => {
          result.current.boards = [{ ...mockBoard, lists: [mockList] }];
        });

        const updatedList = { ...mockList, title: '更新后的列表' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedList)
        });

        await act(async () => {
          await result.current.updateList('list-1', { title: '更新后的列表' });
        });

        expect(result.current.boards[0].lists![0].title).toBe('更新后的列表');
      });
    });

    describe('deleteList', () => {
      it('should delete list successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置数据
        act(() => {
          result.current.boards = [{ ...mockBoard, lists: [mockList] }];
        });

        mockFetch.mockResolvedValueOnce({
          ok: true
        });

        await act(async () => {
          await result.current.deleteList('list-1');
        });

        expect(result.current.boards[0].lists).toHaveLength(0);
      });
    });
  });

  describe('Card Management', () => {
    describe('createCard', () => {
      it('should create card successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置数据
        act(() => {
          result.current.boards = [{
            ...mockBoard,
            lists: [{ ...mockList, cards: [] }]
          }];
        });

        const cardData: CardCreate = {
          title: '新卡片',
          list_id: 'list-1'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCard)
        });

        await act(async () => {
          await result.current.createCard(cardData);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData)
        });
        expect(result.current.boards[0].lists![0].cards).toHaveLength(1);
        expect(result.current.boards[0].lists![0].cards![0]).toEqual(mockCard);
      });
    });

    describe('updateCard', () => {
      it('should update card successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置数据
        act(() => {
          result.current.boards = [{
            ...mockBoard,
            lists: [{ ...mockList, cards: [mockCard] }]
          }];
        });

        const updatedCard = { ...mockCard, title: '更新后的卡片' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedCard)
        });

        await act(async () => {
          await result.current.updateCard('card-1', { title: '更新后的卡片' });
        });

        expect(result.current.boards[0].lists![0].cards![0].title).toBe('更新后的卡片');
      });
    });

    describe('deleteCard', () => {
      it('should delete card successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先设置数据
        act(() => {
          result.current.boards = [{
            ...mockBoard,
            lists: [{ ...mockList, cards: [mockCard] }]
          }];
        });

        mockFetch.mockResolvedValueOnce({
          ok: true
        });

        await act(async () => {
          await result.current.deleteCard('card-1');
        });

        expect(result.current.boards[0].lists![0].cards).toHaveLength(0);
      });
    });

    describe('moveCard', () => {
      it('should move card successfully', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 模拟 fetchBoard 方法
        const mockFetchBoard = jest.fn();
        result.current.fetchBoard = mockFetchBoard;

        mockFetch.mockResolvedValueOnce({
          ok: true
        });

        await act(async () => {
          await result.current.moveCard({
            card_id: 'card-1',
            source_list_id: 'list-1',
            target_list_id: 'list-2',
            new_position: 0
          });
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/cards/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_id: 'card-1',
            source_list_id: 'list-1',
            target_list_id: 'list-2',
            new_position: 0
          })
        });
        expect(mockFetchBoard).toHaveBeenCalledWith('list-2');
      });
    });
  });

  describe('Drag and Drop Operations', () => {
    describe('startDraggingCard', () => {
      it('should start dragging card', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.startDraggingCard(mockCard);
        });

        expect(result.current.draggedCard).toEqual(mockCard);
        expect(result.current.isDragging).toBe(true);
        expect(result.current.draggedCardOriginalListId).toBe(mockCard.list_id);
        expect(result.current.dragHistory).toHaveLength(1);
        expect(result.current.dragHistory[0]).toMatchObject({
          type: 'card',
          cardId: mockCard.id,
          originalListId: mockCard.list_id,
          originalPosition: mockCard.position
        });
      });
    });

    describe('startDraggingList', () => {
      it('should start dragging list', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.startDraggingList(mockList);
        });

        expect(result.current.draggedList).toEqual(mockList);
        expect(result.current.isDragging).toBe(true);
        expect(result.current.draggedListOriginalPosition).toBe(mockList.position);
        expect(result.current.dragHistory).toHaveLength(1);
        expect(result.current.dragHistory[0]).toMatchObject({
          type: 'list',
          listId: mockList.id,
          originalPosition: mockList.position
        });
      });
    });

    describe('endDragging', () => {
      it('should end dragging and clear drag state', () => {
        const { result } = renderHook(() => useKanbanStore());

        // 先开始拖拽
        act(() => {
          result.current.startDraggingCard(mockCard);
          result.current.setDragOverList('list-2');
        });

        // 结束拖拽
        act(() => {
          result.current.endDragging();
        });

        expect(result.current.draggedCard).toBe(null);
        expect(result.current.draggedList).toBe(null);
        expect(result.current.dragOverListId).toBe(null);
        expect(result.current.isDragging).toBe(false);
        expect(result.current.draggedCardOriginalListId).toBe(null);
        expect(result.current.draggedListOriginalPosition).toBe(null);
      });
    });

    describe('setDragOverList', () => {
      it('should set drag over list id', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.setDragOverList('list-2');
        });

        expect(result.current.dragOverListId).toBe('list-2');
      });
    });

    describe('rollbackDragOperation', () => {
      it('should rollback card drag operation', async () => {
        const { result } = renderHook(() => useKanbanStore());

        // 模拟 fetchBoard
        const mockFetchBoard = jest.fn();
        result.current.fetchBoard = mockFetchBoard;

        // 先开始拖拽卡片
        act(() => {
          result.current.startDraggingCard(mockCard);
        });

        mockFetch.mockResolvedValueOnce({ ok: true });

        await act(async () => {
          result.current.rollbackDragOperation();
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/kanban/cards/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_list_id: mockCard.list_id,
            target_list_id: mockCard.list_id,
            new_position: mockCard.position
          })
        });
      });

      it('should handle empty drag history', () => {
        const { result } = renderHook(() => useKanbanStore());

        // 没有拖拽历史时调用回滚
        act(() => {
          result.current.rollbackDragOperation();
        });

        // 应该不会调用任何API
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should set search query', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setSearchQuery('测试搜索');
      });

      expect(result.current.searchQuery).toBe('测试搜索');
    });

    it('should set filter priority', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setFilterPriority('high');
      });

      expect(result.current.filterPriority).toBe('high');
    });

    it('should set filter completed', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setFilterCompleted(true);
      });

      expect(result.current.filterCompleted).toBe(true);
    });

    describe('getFilteredCards', () => {
      beforeEach(() => {
        const { result } = renderHook(() => useKanbanStore());

        const card1 = { ...mockCard, id: 'card-1', title: '测试卡片', priority: 'high' as const, is_completed: false };
        const card2 = { ...mockCard, id: 'card-2', title: '其他卡片', priority: 'low' as const, is_completed: true };

        act(() => {
          result.current.boards = [{
            ...mockBoard,
            lists: [{
              ...mockList,
              cards: [card1, card2]
            }]
          }];
        });
      });

      it('should filter cards by search query', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.setSearchQuery('测试');
        });

        const filteredCards = result.current.getFilteredCards();
        expect(filteredCards).toHaveLength(1);
        expect(filteredCards[0].title).toBe('测试卡片');
      });

      it('should filter cards by priority', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.setFilterPriority('high');
        });

        const filteredCards = result.current.getFilteredCards();
        expect(filteredCards).toHaveLength(1);
        expect(filteredCards[0].priority).toBe('high');
      });

      it('should filter cards by completion status', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.setFilterCompleted(true);
        });

        const filteredCards = result.current.getFilteredCards();
        expect(filteredCards).toHaveLength(1);
        expect(filteredCards[0].is_completed).toBe(true);
      });
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.boards = [{
          ...mockBoard,
          lists: [{
            ...mockList,
            cards: [mockCard]
          }]
        }];
        result.current.currentBoardId = 'board-1';
      });
    });

    describe('getCurrentBoard', () => {
      it('should return current board', () => {
        const { result } = renderHook(() => useKanbanStore());

        const currentBoard = result.current.getCurrentBoard();
        expect(currentBoard?.id).toBe('board-1');
      });

      it('should return null when no current board', () => {
        const { result } = renderHook(() => useKanbanStore());

        act(() => {
          result.current.setCurrentBoard(null);
        });

        const currentBoard = result.current.getCurrentBoard();
        expect(currentBoard).toBe(null);
      });
    });

    describe('getBoardById', () => {
      it('should return board by id', () => {
        const { result } = renderHook(() => useKanbanStore());

        const board = result.current.getBoardById('board-1');
        expect(board?.id).toBe('board-1');
      });

      it('should return null for non-existent board', () => {
        const { result } = renderHook(() => useKanbanStore());

        const board = result.current.getBoardById('non-existent');
        expect(board).toBe(null);
      });
    });

    describe('getListById', () => {
      it('should return list by id', () => {
        const { result } = renderHook(() => useKanbanStore());

        const list = result.current.getListById('list-1');
        expect(list?.id).toBe('list-1');
      });

      it('should return null for non-existent list', () => {
        const { result } = renderHook(() => useKanbanStore());

        const list = result.current.getListById('non-existent');
        expect(list).toBe(null);
      });
    });

    describe('getCardById', () => {
      it('should return card by id', () => {
        const { result } = renderHook(() => useKanbanStore());

        const card = result.current.getCardById('card-1');
        expect(card?.id).toBe('card-1');
      });

      it('should return null for non-existent card', () => {
        const { result } = renderHook(() => useKanbanStore());

        const card = result.current.getCardById('non-existent');
        expect(card).toBe(null);
      });
    });
  });

  describe('Error and Loading State', () => {
    it('should set error state', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setError('测试错误');
      });

      expect(result.current.error).toBe('测试错误');
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});