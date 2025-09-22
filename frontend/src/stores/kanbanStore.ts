/**
 * 项目管理看板状态管理
 * 基于Zustand的状态管理，支持看板、列表、卡片的三层次结构
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Board,
  List,
  Card,
  BoardCreate,
  BoardUpdate,
  ListCreate,
  ListUpdate,
  CardCreate,
  CardUpdate,
  CardMoveRequest,
  PriorityLevel,
  SearchRequest
} from '@/types/kanban';

interface KanbanState {
  // 看板数据
  boards: Board[];
  currentBoardId: string | null;

  // 加载状态
  isLoading: boolean;
  isDragging: boolean;
  error: string | null;

  // 搜索和过滤
  searchQuery: string;
  filterPriority: PriorityLevel | 'all';
  filterCompleted: boolean | null;

  // 拖拽状态
  draggedCard: Card | null;
  draggedList: List | null;
  dragOverListId: string | null;
  draggedCardOriginalListId: string | null;
  draggedListOriginalPosition: number | null;
  dragHistory: any[];
}

interface KanbanActions {
  // 看板管理
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  createBoard: (boardData: BoardCreate) => Promise<Board | null>;
  updateBoard: (boardId: string, boardData: BoardUpdate) => Promise<Board | null>;
  deleteBoard: (boardId: string) => Promise<boolean>;
  setCurrentBoard: (boardId: string | null) => void;

  // 列表管理
  createList: (listData: ListCreate) => Promise<List | null>;
  updateList: (listId: string, listData: ListUpdate) => Promise<List | null>;
  deleteList: (listId: string) => Promise<boolean>;
  reorderLists: (listIds: string[]) => void;

  // 卡片管理
  createCard: (cardData: CardCreate) => Promise<Card | null>;
  updateCard: (cardId: string, cardData: CardUpdate) => Promise<Card | null>;
  deleteCard: (cardId: string) => Promise<boolean>;
  moveCard: (moveData: CardMoveRequest) => Promise<boolean>;
  bulkUpdateCards: (cardIds: string[], updates: CardUpdate) => Promise<number>;

  // 拖拽操作
  startDraggingCard: (card: Card) => void;
  startDraggingList: (list: List) => void;
  endDragging: () => void;
  setDragOverList: (listId: string | null) => void;
  rollbackDragOperation: () => void;

  // 搜索和过滤
  setSearchQuery: (query: string) => void;
  setFilterPriority: (priority: PriorityLevel | 'all') => void;
  setFilterCompleted: (completed: boolean | null) => void;
  searchCards: (query: SearchRequest) => Promise<Card[]>;

  // 工具方法
  getCurrentBoard: () => Board | null;
  getBoardById: (boardId: string) => Board | null;
  getListById: (listId: string) => List | null;
  getCardById: (cardId: string) => Card | null;
  getFilteredCards: () => Card[];
  getBoardStats: (boardId: string) => Promise<any>;

  // 错误处理
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useKanbanStore = create<KanbanState & KanbanActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      boards: [],
      currentBoardId: null,
      isLoading: false,
      isDragging: false,
      error: null,
      searchQuery: '',
      filterPriority: 'all',
      filterCompleted: null,
      draggedCard: null,
      draggedList: null,
      dragOverListId: null,
      draggedCardOriginalListId: null,
      draggedListOriginalPosition: null,
      dragHistory: [],

      // 看板管理
      fetchBoards: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/kanban/boards');
          if (!response.ok) throw new Error('获取看板失败');

          const boards = await response.json();
          set({ boards, isLoading: false });
        } catch (error) {
          set({ error: '获取看板失败', isLoading: false });
          throw error;
        }
      },

      fetchBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/boards/${boardId}`);
          if (!response.ok) throw new Error('获取看板详情失败');

          const board = await response.json();
          const { boards } = get();
          const updatedBoards = boards.map(b => b.id === boardId ? board : b);
          set({ boards: updatedBoards, isLoading: false });
        } catch (error) {
          set({ error: '获取看板详情失败', isLoading: false });
          throw error;
        }
      },

      createBoard: async (boardData: BoardCreate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/kanban/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(boardData)
          });

          if (!response.ok) throw new Error('创建看板失败');

          const newBoard = await response.json();
          const { boards } = get();
          set({ boards: [...boards, newBoard], isLoading: false });
          return newBoard;
        } catch (error) {
          set({ error: '创建看板失败', isLoading: false });
          throw error;
        }
      },

      updateBoard: async (boardId: string, boardData: BoardUpdate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/boards/${boardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(boardData)
          });

          if (!response.ok) throw new Error('更新看板失败');

          const updatedBoard = await response.json();
          const { boards } = get();
          const updatedBoards = boards.map(b => b.id === boardId ? updatedBoard : b);
          set({ boards: updatedBoards, isLoading: false });
          return updatedBoard;
        } catch (error) {
          set({ error: '更新看板失败', isLoading: false });
          throw error;
        }
      },

      deleteBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/boards/${boardId}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('删除看板失败');

          const { boards, currentBoardId } = get();
          const updatedBoards = boards.filter(b => b.id !== boardId);
          set({
            boards: updatedBoards,
            currentBoardId: currentBoardId === boardId ? null : currentBoardId,
            isLoading: false
          });
          return true;
        } catch (error) {
          set({ error: '删除看板失败', isLoading: false });
          throw error;
        }
      },

      setCurrentBoard: (boardId: string | null) => {
        set({ currentBoardId: boardId });
      },

      // 列表管理
      createList: async (listData: ListCreate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/kanban/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listData)
          });

          if (!response.ok) throw new Error('创建列表失败');

          const newList = await response.json();
          const { boards } = get();
          const updatedBoards = boards.map(board => {
            if (board.id === listData.board_id) {
              return {
                ...board,
                lists: [...(board.lists || []), newList]
              };
            }
            return board;
          });
          set({ boards: updatedBoards, isLoading: false });
          return newList;
        } catch (error) {
          set({ error: '创建列表失败', isLoading: false });
          throw error;
        }
      },

      updateList: async (listId: string, listData: ListUpdate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/lists/${listId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listData)
          });

          if (!response.ok) throw new Error('更新列表失败');

          const updatedList = await response.json();
          const { boards } = get();
          const updatedBoards = boards.map(board => ({
            ...board,
            lists: board.lists?.map(lst =>
              lst.id === listId ? updatedList : lst
            ) || []
          }));
          set({ boards: updatedBoards, isLoading: false });
          return updatedList;
        } catch (error) {
          set({ error: '更新列表失败', isLoading: false });
          throw error;
        }
      },

      deleteList: async (listId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/lists/${listId}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('删除列表失败');

          const { boards } = get();
          const updatedBoards = boards.map(board => ({
            ...board,
            lists: board.lists?.filter(lst => lst.id !== listId) || []
          }));
          set({ boards: updatedBoards, isLoading: false });
          return true;
        } catch (error) {
          set({ error: '删除列表失败', isLoading: false });
          throw error;
        }
      },

      // 卡片管理
      createCard: async (cardData: CardCreate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/kanban/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
          });

          if (!response.ok) throw new Error('创建卡片失败');

          const newCard = await response.json();
          const { boards } = get();
          const updatedBoards = boards.map(board => ({
            ...board,
            lists: board.lists?.map(lst => {
              if (lst.id === cardData.list_id) {
                return {
                  ...lst,
                  cards: [...(lst.cards || []), newCard]
                };
              }
              return lst;
            }) || []
          }));
          set({ boards: updatedBoards, isLoading: false });
          return newCard;
        } catch (error) {
          set({ error: '创建卡片失败', isLoading: false });
          throw error;
        }
      },

      updateCard: async (cardId: string, cardData: CardUpdate) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/cards/${cardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
          });

          if (!response.ok) throw new Error('更新卡片失败');

          const updatedCard = await response.json();
          const { boards } = get();
          const updatedBoards = boards.map(board => ({
            ...board,
            lists: board.lists?.map(lst => ({
              ...lst,
              cards: lst.cards?.map(card =>
                card.id === cardId ? updatedCard : card
              ) || []
            })) || []
          }));
          set({ boards: updatedBoards, isLoading: false });
          return updatedCard;
        } catch (error) {
          set({ error: '更新卡片失败', isLoading: false });
          throw error;
        }
      },

      deleteCard: async (cardId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/kanban/cards/${cardId}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('删除卡片失败');

          const { boards } = get();
          const updatedBoards = boards.map(board => ({
            ...board,
            lists: board.lists?.map(lst => ({
              ...lst,
              cards: lst.cards?.filter(card => card.id !== cardId) || []
            })) || []
          }));
          set({ boards: updatedBoards, isLoading: false });
          return true;
        } catch (error) {
          set({ error: '删除卡片失败', isLoading: false });
          throw error;
        }
      },

      moveCard: async (moveData: CardMoveRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/kanban/cards/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moveData)
          });

          if (!response.ok) throw new Error('移动卡片失败');

          // 重新获取看板数据以更新状态
          await get().fetchBoard(moveData.target_list_id);
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ error: '移动卡片失败', isLoading: false });
          throw error;
        }
      },

      // 拖拽操作
      startDraggingCard: (card: Card) => {
        const { boards } = get();
        const originalListId = card.list_id;

        // 保存拖拽历史用于回滚
        const history = {
          type: 'card',
          cardId: card.id,
          originalListId,
          originalPosition: card.position,
          timestamp: Date.now()
        };

        set({
          draggedCard: card,
          isDragging: true,
          draggedCardOriginalListId: originalListId,
          dragHistory: [...get().dragHistory, history]
        });
      },

      startDraggingList: (list: List) => {
        const history = {
          type: 'list',
          listId: list.id,
          originalPosition: list.position,
          timestamp: Date.now()
        };

        set({
          draggedList: list,
          isDragging: true,
          draggedListOriginalPosition: list.position,
          dragHistory: [...get().dragHistory, history]
        });
      },

      endDragging: () => {
        set({
          draggedCard: null,
          draggedList: null,
          dragOverListId: null,
          isDragging: false,
          draggedCardOriginalListId: null,
          draggedListOriginalPosition: null
        });
      },

      setDragOverList: (listId: string | null) => {
        set({ dragOverListId: listId });
      },

      rollbackDragOperation: () => {
        const {
          dragHistory,
          draggedCard,
          draggedList,
          draggedCardOriginalListId,
          draggedListOriginalPosition
        } = get();

        if (dragHistory.length === 0) return;

        const lastOperation = dragHistory[dragHistory.length - 1];

        try {
          if (lastOperation.type === 'card' && draggedCard) {
            // 回滚卡片位置
            const rollbackData = {
              source_list_id: draggedCard.list_id,
              target_list_id: draggedCardOriginalListId!,
              new_position: lastOperation.originalPosition
            };

            // 这里调用API进行回滚
            fetch('/api/kanban/cards/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rollbackData)
            }).then(() => {
              // 重新获取看板数据
              get().fetchBoard(get().currentBoardId!);
            });
          } else if (lastOperation.type === 'list' && draggedList) {
            // 回滚列表位置
            fetch(`/api/kanban/lists/${draggedList.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: draggedListOriginalPosition })
            }).then(() => {
              // 重新获取看板数据
              get().fetchBoard(get().currentBoardId!);
            });
          }
        } catch (error) {
          console.error('回滚操作失败:', error);
        } finally {
          // 清理拖拽历史
          set({
            dragHistory: dragHistory.slice(0, -1),
            draggedCard: null,
            draggedList: null,
            draggedCardOriginalListId: null,
            draggedListOriginalPosition: null,
            isDragging: false
          });
        }
      },

      // 搜索和过滤
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setFilterPriority: (priority: PriorityLevel | 'all') => {
        set({ filterPriority: priority });
      },

      setFilterCompleted: (completed: boolean | null) => {
        set({ filterCompleted: completed });
      },

      // 工具方法
      getCurrentBoard: () => {
        const { boards, currentBoardId } = get();
        return boards.find(board => board.id === currentBoardId) || null;
      },

      getBoardById: (boardId: string) => {
        const { boards } = get();
        return boards.find(board => board.id === boardId) || null;
      },

      getListById: (listId: string) => {
        const { boards } = get();
        for (const board of boards) {
          const list = board.lists?.find(lst => lst.id === listId);
          if (list) return list;
        }
        return null;
      },

      getCardById: (cardId: string) => {
        const { boards } = get();
        for (const board of boards) {
          for (const list of board.lists || []) {
            const card = list.cards?.find(c => c.id === cardId);
            if (card) return card;
          }
        }
        return null;
      },

      getFilteredCards: () => {
        const { boards, searchQuery, filterPriority, filterCompleted } = get();
        const allCards: Card[] = [];

        boards.forEach(board => {
          board.lists?.forEach(list => {
            list.cards?.forEach(card => {
              allCards.push(card);
            });
          });
        });

        return allCards.filter(card => {
          // 搜索过滤
          if (searchQuery) {
            const matchesSearch =
              card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
              card.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            if (!matchesSearch) return false;
          }

          // 优先级过滤
          if (filterPriority !== 'all' && card.priority !== filterPriority) {
            return false;
          }

          // 完成状态过滤
          if (filterCompleted !== null && card.is_completed !== filterCompleted) {
            return false;
          }

          return true;
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'kanban-store',
      partialize: (state) => ({
        // 只持久化配置数据，不持久化临时状态
        boards: state.boards,
        currentBoardId: state.currentBoardId,
        searchQuery: state.searchQuery,
        filterPriority: state.filterPriority,
        filterCompleted: state.filterCompleted
      })
    }
  )
);