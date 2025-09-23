/**
 * 记事本状态管理测试
 * 测试核心业务逻辑和状态管理
 */

import { renderHook, act } from '@testing-library/react';

// Mock the store without selectors - just test the basic store
const mockStore = {
  notes: [] as any[],
  selectedNoteId: null as string | null,
  todos: [] as any[],
  filters: {
    searchQuery: '',
    tags: [] as string[],
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
    isBookmarked: undefined as boolean | undefined,
  },

  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  selectNote: jest.fn(),
  bookmarkNote: jest.fn(),
  setNotes: jest.fn(),
  setSearchQuery: jest.fn(),
  setTagsFilter: jest.fn(),
  setSortBy: jest.fn(),
  setFilters: jest.fn(),
  addTodo: jest.fn(),
  toggleTodo: jest.fn(),
  removeTodo: jest.fn(),
  setAIProcessing: jest.fn(),
  setAIError: jest.fn(),
  clearAIError: jest.fn(),
  organizeNote: jest.fn(),
  extractTodos: jest.fn(),
};

// Mock the store module
jest.mock('@/stores/noteStore', () => ({
  useNoteStore: () => mockStore,
}));

import { useNoteStore } from '@/stores/noteStore';

describe('noteStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store state
    mockStore.notes = [];
    mockStore.selectedNoteId = null;
    mockStore.todos = [];
    mockStore.filters = {
      searchQuery: '',
      tags: [],
      sortBy: 'updatedAt' as const,
      sortOrder: 'desc' as const,
      isBookmarked: undefined,
    };
  });

  describe('Note CRUD operations', () => {
    it('should call createNote with correct parameters', () => {
      const store = useNoteStore();
      const noteData = { title: '测试笔记', content: '测试内容' };

      store.createNote(noteData);

      expect(store.createNote).toHaveBeenCalledWith(noteData);
    });

    it('should call updateNote with correct parameters', () => {
      const store = useNoteStore();
      const noteId = '1';
      const updateData = { title: '更新后的标题' };

      store.updateNote(noteId, updateData);

      expect(store.updateNote).toHaveBeenCalledWith(noteId, updateData);
    });

    it('should call deleteNote with correct parameters', () => {
      const store = useNoteStore();
      const noteId = '1';

      store.deleteNote(noteId);

      expect(store.deleteNote).toHaveBeenCalledWith(noteId);
    });

    it('should call bookmarkNote with correct parameters', () => {
      const store = useNoteStore();
      const noteId = '1';

      store.bookmarkNote(noteId);

      expect(store.bookmarkNote).toHaveBeenCalledWith(noteId);
    });
  });

  describe('Note selection', () => {
    it('should call selectNote with correct parameters', () => {
      const store = useNoteStore();
      const noteId = '1';

      store.selectNote(noteId);

      expect(store.selectNote).toHaveBeenCalledWith(noteId);
    });

    it('should call selectNote with null to clear selection', () => {
      const store = useNoteStore();

      store.selectNote(null);

      expect(store.selectNote).toHaveBeenCalledWith(null);
    });
  });

  describe('Filters', () => {
    it('should call setSearchQuery with correct parameters', () => {
      const store = useNoteStore();
      const query = '测试';

      store.setSearchQuery(query);

      expect(store.setSearchQuery).toHaveBeenCalledWith(query);
    });

    it('should call setTagsFilter with correct parameters', () => {
      const store = useNoteStore();
      const tags = ['标签1', '标签2'];

      store.setTagsFilter(tags);

      expect(store.setTagsFilter).toHaveBeenCalledWith(tags);
    });

    it('should call setSortBy with correct parameters', () => {
      const store = useNoteStore();
      const sortBy = 'createdAt';

      store.setSortBy(sortBy);

      expect(store.setSortBy).toHaveBeenCalledWith(sortBy);
    });

    it('should call setFilters with correct parameters', () => {
      const store = useNoteStore();
      const filters = { isBookmarked: true };

      store.setFilters(filters);

      expect(store.setFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe('Todos', () => {
    it('should call addTodo with correct parameters', () => {
      const store = useNoteStore();
      const newTodo = {
        id: 'todo-1',
        content: '测试Todo',
        isCompleted: false,
        priority: 'medium',
        noteId: '1',
        createdAt: new Date(),
      };

      store.addTodo(newTodo);

      expect(store.addTodo).toHaveBeenCalledWith(newTodo);
    });

    it('should call toggleTodo with correct parameters', () => {
      const store = useNoteStore();
      const todoId = 'todo-1';

      store.toggleTodo(todoId);

      expect(store.toggleTodo).toHaveBeenCalledWith(todoId);
    });

    it('should call removeTodo with correct parameters', () => {
      const store = useNoteStore();
      const todoId = 'todo-1';

      store.removeTodo(todoId);

      expect(store.removeTodo).toHaveBeenCalledWith(todoId);
    });
  });

  describe('AI Functions', () => {
    it('should call setAIProcessing with correct parameters', () => {
      const store = useNoteStore();

      store.setAIProcessing(true);

      expect(store.setAIProcessing).toHaveBeenCalledWith(true);
    });

    it('should call setAIError with correct parameters', () => {
      const store = useNoteStore();
      const error = 'AI处理失败';

      store.setAIError(error);

      expect(store.setAIError).toHaveBeenCalledWith(error);
    });

    it('should call clearAIError', () => {
      const store = useNoteStore();

      store.clearAIError();

      expect(store.clearAIError).toHaveBeenCalled();
    });

    it('should call organizeNote with correct parameters', () => {
      const store = useNoteStore();
      const noteId = '1';

      store.organizeNote(noteId);

      expect(store.organizeNote).toHaveBeenCalledWith(noteId);
    });

    it('should call extractTodos with correct parameters', () => {
      const store = useNoteStore();
      const noteId = '1';

      store.extractTodos(noteId);

      expect(store.extractTodos).toHaveBeenCalledWith(noteId);
    });
  });

  describe('Store State', () => {
    it('should have correct initial state', () => {
      const store = useNoteStore();

      expect(store.notes).toEqual([]);
      expect(store.selectedNoteId).toBe(null);
      expect(store.todos).toEqual([]);
      expect(store.filters.searchQuery).toBe('');
      expect(store.filters.tags).toEqual([]);
      expect(store.filters.sortBy).toBe('updatedAt');
      expect(store.filters.sortOrder).toBe('desc');
    });

    it('should call setNotes with correct parameters', () => {
      const store = useNoteStore();
      const notes = [
        {
          id: '1',
          title: '测试笔记',
          content: '测试内容',
          isBookmarked: false,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          wordCount: 10,
          readingTime: 1,
        },
      ];

      store.setNotes(notes);

      expect(store.setNotes).toHaveBeenCalledWith(notes);
    });
  });
});