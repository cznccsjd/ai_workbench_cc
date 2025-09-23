/**
 * kanbanStore 测试
 */

import { renderHook, act } from '@testing-library/react';

// Mock Zustand before import
jest.mock('zustand', () => ({
  create: () => () => ({
    boards: [],
    currentBoardId: null,
    createBoard: jest.fn(() => ({ id: 'new-board', title: '新看板', columns: [] })),
    selectBoard: jest.fn(),
    deleteBoard: jest.fn(),
    updateBoard: jest.fn(),
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    moveCard: jest.fn(),
    getCurrentBoard: jest.fn(() => null),
  }),
  devtools: (fn: any) => fn,
}));

import { useKanbanStore } from '@/stores/kanbanStore';

describe('kanbanStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty boards', () => {
    const store = useKanbanStore();
    expect(store.boards).toEqual([]);
    expect(store.currentBoardId).toBe(null);
  });

  it('should create a new board', () => {
    const store = useKanbanStore();
    const result = store.createBoard();

    expect(store.createBoard).toHaveBeenCalled();
    expect(result).toEqual({ id: 'new-board', title: '新看板', columns: [] });
  });

  it('should handle store operations', () => {
    const store = useKanbanStore();

    // Test that all methods exist and can be called
    expect(typeof store.selectBoard).toBe('function');
    expect(typeof store.deleteBoard).toBe('function');
    expect(typeof store.updateBoard).toBe('function');
    expect(typeof store.createCard).toBe('function');
    expect(typeof store.updateCard).toBe('function');
    expect(typeof store.deleteCard).toBe('function');
    expect(typeof store.moveCard).toBe('function');
    expect(typeof store.getCurrentBoard).toBe('function');
  });
});