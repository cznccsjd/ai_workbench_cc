/**
 * 记事本状态管理测试
 */

import { renderHook, act } from '@testing-library/react';
import { useNoteStore, useFilteredNotes, useSelectedNote, useNoteTodos } from '@/stores/noteStore';
import { Note, TodoItem } from '@/types/note';

// 模拟zustand的create函数
jest.mock('zustand', () => ({
  create: (fn: any) => {
    const store = fn(() => store.getState());
    store.getState = () => store;
    return store;
  },
  devtools: (fn: any) => fn,
}));

describe('noteStore', () => {
  let store: any;

  beforeEach(() => {
    // 创建新的store实例用于每个测试
    store = useNoteStore;
    // 重置store状态
    act(() => {
      store.setState({
        notes: [],
        selectedNoteId: null,
        todos: [],
        filters: {
          searchQuery: '',
          tags: [],
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        },
        isLoading: false,
        error: null,
        aiProcessing: false,
        aiError: null,
      });
    });
  });

  describe('Note CRUD operations', () => {
    it('should create a new note', async () => {
      const { result } = renderHook(() => useNoteStore());

      await act(async () => {
        await result.current.createNote({
          title: '测试笔记',
          content: '测试内容',
        });
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('测试笔记');
      expect(result.current.notes[0].content).toBe('测试内容');
      expect(result.current.selectedNoteId).toBe(result.current.notes[0].id);
    });

    it('should update an existing note', async () => {
      const { result } = renderHook(() => useNoteStore());

      // 先创建一个笔记
      await act(async () => {
        await result.current.createNote({
          title: '原始标题',
          content: '原始内容',
        });
      });

      const noteId = result.current.notes[0].id;

      // 更新笔记
      await act(async () => {
        await result.current.updateNote(noteId, {
          title: '更新后的标题',
          content: '更新后的内容',
        });
      });

      expect(result.current.notes[0].title).toBe('更新后的标题');
      expect(result.current.notes[0].content).toBe('更新后的内容');
    });

    it('should delete a note', async () => {
      const { result } = renderHook(() => useNoteStore());

      // 先创建两个笔记
      await act(async () => {
        await result.current.createNote({ title: '笔记1' });
        await result.current.createNote({ title: '笔记2' });
      });

      expect(result.current.notes).toHaveLength(2);

      const noteId = result.current.notes[0].id;

      // 删除第一个笔记
      await act(async () => {
        await result.current.deleteNote(noteId);
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('笔记2');
    });

    it('should toggle bookmark status', async () => {
      const { result } = renderHook(() => useNoteStore());

      // 创建一个笔记
      await act(async () => {
        await result.current.createNote({ title: '测试笔记' });
      });

      const noteId = result.current.notes[0].id;
      expect(result.current.notes[0].isBookmarked).toBe(false);

      // 切换收藏状态
      await act(async () => {
        await result.current.bookmarkNote(noteId);
      });

      expect(result.current.notes[0].isBookmarked).toBe(true);

      // 再次切换
      await act(async () => {
        await result.current.bookmarkNote(noteId);
      });

      expect(result.current.notes[0].isBookmarked).toBe(false);
    });
  });

  describe('Note selection', () => {
    it('should select a note', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setNotes([
          {
            id: '1',
            title: '笔记1',
            content: '内容1',
            isBookmarked: false,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 10,
            readingTime: 1,
          },
        ]);
      });

      act(() => {
        result.current.selectNote('1');
      });

      expect(result.current.selectedNoteId).toBe('1');
    });

    it('should clear note selection', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.selectNote('1');
      });

      act(() => {
        result.current.selectNote(null);
      });

      expect(result.current.selectedNoteId).toBe(null);
    });
  });

  describe('Filters', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setSearchQuery('测试');
      });

      expect(result.current.filters.searchQuery).toBe('测试');
    });

    it('should update tags filter', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setTagsFilter(['标签1', '标签2']);
      });

      expect(result.current.filters.tags).toEqual(['标签1', '标签2']);
    });

    it('should update sort by', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setSortBy('createdAt');
      });

      expect(result.current.filters.sortBy).toBe('createdAt');
    });
  });

  describe('Todos', () => {
    it('should add a todo', () => {
      const { result } = renderHook(() => useNoteStore());

      const newTodo: TodoItem = {
        id: 'todo-1',
        content: '测试Todo',
        isCompleted: false,
        priority: 'medium',
        noteId: '1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTodo(newTodo);
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].content).toBe('测试Todo');
    });

    it('should toggle todo completion', () => {
      const { result } = renderHook(() => useNoteStore());

      const newTodo: TodoItem = {
        id: 'todo-1',
        content: '测试Todo',
        isCompleted: false,
        priority: 'medium',
        noteId: '1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTodo(newTodo);
      });

      expect(result.current.todos[0].isCompleted).toBe(false);

      act(() => {
        result.current.toggleTodo('todo-1');
      });

      expect(result.current.todos[0].isCompleted).toBe(true);
    });

    it('should remove a todo', () => {
      const { result } = renderHook(() => useNoteStore());

      const newTodo: TodoItem = {
        id: 'todo-1',
        content: '测试Todo',
        isCompleted: false,
        priority: 'medium',
        noteId: '1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTodo(newTodo);
      });

      expect(result.current.todos).toHaveLength(1);

      act(() => {
        result.current.removeTodo('todo-1');
      });

      expect(result.current.todos).toHaveLength(0);
    });
  });

  describe('AI Functions', () => {
    it('should set AI processing state', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setAIProcessing(true);
      });

      expect(result.current.aiProcessing).toBe(true);
    });

    it('should set AI error', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setAIError('AI处理失败');
      });

      expect(result.current.aiError).toBe('AI处理失败');
    });

    it('should clear AI error', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setAIError('AI处理失败');
      });

      act(() => {
        result.current.clearAIError();
      });

      expect(result.current.aiError).toBe(null);
    });

    it('should organize note with AI', async () => {
      const { result } = renderHook(() => useNoteStore());

      // 创建一个笔记
      await act(async () => {
        await result.current.createNote({
          title: '原始标题',
          content: '原始内容',
        });
      });

      const noteId = result.current.notes[0].id;

      // 模拟AI整理
      await act(async () => {
        await result.current.organizeNote(noteId);
      });

      // 由于是模拟实现，笔记内容应该被更新
      expect(result.current.notes[0].title).toContain('AI整理');
    });

    it('should extract todos with AI', async () => {
      const { result } = renderHook(() => useNoteStore());

      // 创建一个笔记
      await act(async () => {
        await result.current.createNote({
          title: '项目计划',
          content: '需要完成文档编写和代码审查',
        });
      });

      const noteId = result.current.notes[0].id;
      const initialTodoCount = result.current.todos.length;

      // 模拟AI提取Todo
      await act(async () => {
        await result.current.extractTodos(noteId);
      });

      // 由于是模拟实现，应该添加了新的Todo
      expect(result.current.todos.length).toBeGreaterThan(initialTodoCount);
    });
  });

  describe('Selectors', () => {
    it('should filter notes by search query', () => {
      const { result } = renderHook(() => {
        const store = useNoteStore();
        const filteredNotes = useFilteredNotes();
        return { store, filteredNotes };
      });

      act(() => {
        result.current.store.setNotes([
          {
            id: '1',
            title: 'Python编程',
            content: 'Python是一种编程语言',
            isBookmarked: false,
            tags: ['编程'],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 20,
            readingTime: 1,
          },
          {
            id: '2',
            title: 'JavaScript开发',
            content: 'JavaScript用于前端开发',
            isBookmarked: false,
            tags: ['前端'],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 25,
            readingTime: 1,
          },
        ]);
      });

      act(() => {
        result.current.store.setSearchQuery('Python');
      });

      expect(result.current.filteredNotes).toHaveLength(1);
      expect(result.current.filteredNotes[0].title).toBe('Python编程');
    });

    it('should filter notes by tags', () => {
      const { result } = renderHook(() => {
        const store = useNoteStore();
        const filteredNotes = useFilteredNotes();
        return { store, filteredNotes };
      });

      act(() => {
        result.current.store.setNotes([
          {
            id: '1',
            title: '笔记1',
            content: '内容1',
            isBookmarked: false,
            tags: ['编程', 'Python'],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 10,
            readingTime: 1,
          },
          {
            id: '2',
            title: '笔记2',
            content: '内容2',
            isBookmarked: false,
            tags: ['设计'],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 15,
            readingTime: 1,
          },
        ]);
      });

      act(() => {
        result.current.store.setTagsFilter(['Python']);
      });

      expect(result.current.filteredNotes).toHaveLength(1);
      expect(result.current.filteredNotes[0].id).toBe('1');
    });

    it('should filter notes by bookmark status', () => {
      const { result } = renderHook(() => {
        const store = useNoteStore();
        const filteredNotes = useFilteredNotes();
        return { store, filteredNotes };
      });

      act(() => {
        result.current.store.setNotes([
          {
            id: '1',
            title: '收藏笔记',
            content: '内容1',
            isBookmarked: true,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 10,
            readingTime: 1,
          },
          {
            id: '2',
            title: '普通笔记',
            content: '内容2',
            isBookmarked: false,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 15,
            readingTime: 1,
          },
        ]);
      });

      act(() => {
        result.current.store.setFilters({ isBookmarked: true });
      });

      expect(result.current.filteredNotes).toHaveLength(1);
      expect(result.current.filteredNotes[0].title).toBe('收藏笔记');
    });

    it('should sort notes', () => {
      const { result } = renderHook(() => {
        const store = useNoteStore();
        const filteredNotes = useFilteredNotes();
        return { store, filteredNotes };
      });

      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-02');

      act(() => {
        result.current.store.setNotes([
          {
            id: '1',
            title: '笔记A',
            content: '内容A',
            isBookmarked: false,
            tags: [],
            createdAt: date1,
            updatedAt: date1,
            wordCount: 10,
            readingTime: 1,
          },
          {
            id: '2',
            title: '笔记B',
            content: '内容B',
            isBookmarked: false,
            tags: [],
            createdAt: date2,
            updatedAt: date2,
            wordCount: 15,
            readingTime: 1,
          },
        ]);
      });

      // 默认按更新时间降序排列
      expect(result.current.filteredNotes[0].id).toBe('2');
      expect(result.current.filteredNotes[1].id).toBe('1');

      // 切换为升序
      act(() => {
        result.current.store.setFilters({ sortOrder: 'asc' });
      });

      expect(result.current.filteredNotes[0].id).toBe('1');
      expect(result.current.filteredNotes[1].id).toBe('2');
    });

    it('should get selected note', () => {
      const { result } = renderHook(() => {
        const store = useNoteStore();
        const selectedNote = useSelectedNote();
        return { store, selectedNote };
      });

      const testNote = {
        id: '1',
        title: '测试笔记',
        content: '测试内容',
        isBookmarked: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
      };

      act(() => {
        result.current.store.setNotes([testNote]);
        result.current.store.selectNote('1');
      });

      expect(result.current.selectedNote).toEqual(testNote);
    });

    it('should get todos for specific note', () => {
      const { result } = renderHook(() => {
        const store = useNoteStore();
        const todos = useNoteTodos('1');
        return { store, todos };
      });

      const testTodo: TodoItem = {
        id: 'todo-1',
        content: '测试Todo',
        isCompleted: false,
        priority: 'medium',
        noteId: '1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.store.addTodo(testTodo);
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].content).toBe('测试Todo');
    });
  });
});