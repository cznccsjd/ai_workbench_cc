/**
 * 实际 noteStore 实现的完整测试
 * 测试真实的 Zustand store 实现和所有业务逻辑
 */

import { act, renderHook } from '@testing-library/react';
import { useNoteStore, useFilteredNotes, useSelectedNote, useNoteTodos } from '../noteStore';
import { Note, TodoItem, CreateNoteData, UpdateNoteData } from '@/types/note';

// 模拟日期以确保测试的一致性
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

describe('noteStore Real Implementation', () => {
  beforeEach(() => {
    // 重置 store 状态
    useNoteStore.getState().setNotes([]);
    useNoteStore.getState().selectNote(null);
    useNoteStore.getState().setTodos([]);
    useNoteStore.getState().setError(null);
    useNoteStore.getState().setAIError(null);
    useNoteStore.getState().setLoading(false);
    useNoteStore.getState().setAIProcessing(false);
    useNoteStore.getState().setFilters({
      searchQuery: '',
      tags: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useNoteStore());

      expect(result.current.notes).toEqual([]);
      expect(result.current.selectedNoteId).toBe(null);
      expect(result.current.todos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.aiProcessing).toBe(false);
      expect(result.current.aiError).toBe(null);
      expect(result.current.filters).toEqual({
        searchQuery: '',
        tags: [],
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
    });
  });

  describe('Note CRUD Operations', () => {
    describe('createNote', () => {
      it('should create a new note successfully', async () => {
        const { result } = renderHook(() => useNoteStore());
        const noteData: CreateNoteData = {
          title: '测试笔记',
          content: '这是一个测试笔记的内容。包含一些单词来测试字数统计。'
        };

        await act(async () => {
          await result.current.createNote(noteData);
        });

        expect(result.current.notes).toHaveLength(1);
        expect(result.current.notes[0]).toMatchObject({
          title: '测试笔记',
          content: '这是一个测试笔记的内容。包含一些单词来测试字数统计。',
          isBookmarked: false,
          tags: [],
        });
        expect(result.current.notes[0].id).toBeDefined();
        expect(result.current.notes[0].wordCount).toBeGreaterThan(0);
        expect(result.current.notes[0].readingTime).toBeGreaterThan(0);
        expect(result.current.selectedNoteId).toBe(result.current.notes[0].id);
        expect(result.current.isLoading).toBe(false);
      });

      it('should handle empty content when creating note', async () => {
        const { result } = renderHook(() => useNoteStore());
        const noteData: CreateNoteData = {
          title: '空内容笔记'
        };

        await act(async () => {
          await result.current.createNote(noteData);
        });

        expect(result.current.notes[0]).toMatchObject({
          title: '空内容笔记',
          content: '',
          wordCount: 0,
          readingTime: 0,
        });
      });

      it('should set loading state during creation', async () => {
        const { result } = renderHook(() => useNoteStore());

        let loadingDuringExecution = false;
        const createPromise = act(async () => {
          const promise = result.current.createNote({ title: '测试', content: '内容' });
          loadingDuringExecution = result.current.isLoading;
          await promise;
        });

        await createPromise;
        expect(loadingDuringExecution).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    describe('updateNote', () => {
      it('should update an existing note', async () => {
        const { result } = renderHook(() => useNoteStore());

        // 先创建一个笔记
        await act(async () => {
          await result.current.createNote({ title: '原始标题', content: '原始内容' });
        });

        const noteId = result.current.notes[0].id;
        const updateData: UpdateNoteData = {
          title: '更新后的标题',
          content: '这是更新后的内容，单词数量更多了。'
        };

        await act(async () => {
          await result.current.updateNote(noteId, updateData);
        });

        const updatedNote = result.current.notes.find(n => n.id === noteId);
        expect(updatedNote).toMatchObject({
          title: '更新后的标题',
          content: '这是更新后的内容，单词数量更多了。'
        });
        expect(updatedNote?.wordCount).toBeGreaterThan(0);
        expect(updatedNote?.readingTime).toBeGreaterThan(0);
      });

      it('should update word count and reading time on content change', async () => {
        const { result } = renderHook(() => useNoteStore());

        await act(async () => {
          await result.current.createNote({ title: '测试', content: '短内容' });
        });

        const noteId = result.current.notes[0].id;
        const longContent = '这是一个很长的内容 '.repeat(50);

        await act(async () => {
          await result.current.updateNote(noteId, { content: longContent });
        });

        const updatedNote = result.current.notes.find(n => n.id === noteId);
        expect(updatedNote?.wordCount).toBeGreaterThan(10);
        expect(updatedNote?.readingTime).toBeGreaterThan(1);
      });
    });

    describe('deleteNote', () => {
      it('should delete a note successfully', async () => {
        const { result } = renderHook(() => useNoteStore());

        await act(async () => {
          await result.current.createNote({ title: '要删除的笔记', content: '内容' });
        });

        const noteId = result.current.notes[0].id;
        expect(result.current.notes).toHaveLength(1);

        await act(async () => {
          await result.current.deleteNote(noteId);
        });

        expect(result.current.notes).toHaveLength(0);
      });

      it('should clear selectedNoteId when deleting selected note', async () => {
        const { result } = renderHook(() => useNoteStore());

        await act(async () => {
          await result.current.createNote({ title: '要删除的笔记', content: '内容' });
        });

        const noteId = result.current.notes[0].id;
        expect(result.current.selectedNoteId).toBe(noteId);

        await act(async () => {
          await result.current.deleteNote(noteId);
        });

        expect(result.current.selectedNoteId).toBe(null);
      });

      it('should not affect selectedNoteId when deleting other note', async () => {
        const { result } = renderHook(() => useNoteStore());

        await act(async () => {
          await result.current.createNote({ title: '笔记1', content: '内容1' });
          await result.current.createNote({ title: '笔记2', content: '内容2' });
        });

        const firstNoteId = result.current.notes[1].id; // 第一个创建的笔记
        const secondNoteId = result.current.notes[0].id; // 第二个创建的笔记

        // 选择第一个笔记
        act(() => {
          result.current.selectNote(firstNoteId);
        });

        // 删除第二个笔记
        await act(async () => {
          await result.current.deleteNote(secondNoteId);
        });

        expect(result.current.selectedNoteId).toBe(firstNoteId);
      });
    });

    describe('selectNote', () => {
      it('should select a note by id', () => {
        const { result } = renderHook(() => useNoteStore());

        act(() => {
          result.current.selectNote('test-id');
        });

        expect(result.current.selectedNoteId).toBe('test-id');
      });

      it('should deselect note when id is null', () => {
        const { result } = renderHook(() => useNoteStore());

        act(() => {
          result.current.selectNote('test-id');
          result.current.selectNote(null);
        });

        expect(result.current.selectedNoteId).toBe(null);
      });
    });

    describe('bookmarkNote', () => {
      it('should toggle bookmark status', async () => {
        const { result } = renderHook(() => useNoteStore());

        await act(async () => {
          await result.current.createNote({ title: '测试笔记', content: '内容' });
        });

        const noteId = result.current.notes[0].id;
        expect(result.current.notes[0].isBookmarked).toBe(false);

        await act(async () => {
          await result.current.bookmarkNote(noteId);
        });

        expect(result.current.notes[0].isBookmarked).toBe(true);

        await act(async () => {
          await result.current.bookmarkNote(noteId);
        });

        expect(result.current.notes[0].isBookmarked).toBe(false);
      });
    });
  });

  describe('Batch Operations', () => {
    it('should set notes', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockNotes: Note[] = [
        {
          id: '1',
          title: '笔记1',
          content: '内容1',
          isBookmarked: false,
          tags: [],
          createdAt: mockDate,
          updatedAt: mockDate,
          wordCount: 1,
          readingTime: 1,
        }
      ];

      act(() => {
        result.current.setNotes(mockNotes);
      });

      expect(result.current.notes).toEqual(mockNotes);
    });

    it('should add note', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockNote: Note = {
        id: '1',
        title: '新笔记',
        content: '内容',
        isBookmarked: false,
        tags: [],
        createdAt: mockDate,
        updatedAt: mockDate,
        wordCount: 1,
        readingTime: 1,
      };

      act(() => {
        result.current.addNote(mockNote);
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0]).toEqual(mockNote);
    });

    it('should remove note', async () => {
      const { result } = renderHook(() => useNoteStore());

      await act(async () => {
        await result.current.createNote({ title: '测试笔记', content: '内容' });
      });

      const noteId = result.current.notes[0].id;
      expect(result.current.notes).toHaveLength(1);

      act(() => {
        result.current.removeNote(noteId);
      });

      expect(result.current.notes).toHaveLength(0);
    });

    it('should update note in store', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockNote: Note = {
        id: '1',
        title: '原始标题',
        content: '原始内容',
        isBookmarked: false,
        tags: [],
        createdAt: mockDate,
        updatedAt: mockDate,
        wordCount: 1,
        readingTime: 1,
      };

      act(() => {
        result.current.addNote(mockNote);
      });

      act(() => {
        result.current.updateNoteInStore('1', {
          title: '更新后的标题',
          tags: ['新标签']
        });
      });

      expect(result.current.notes[0].title).toBe('更新后的标题');
      expect(result.current.notes[0].tags).toEqual(['新标签']);
    });
  });

  describe('Filter and Search Operations', () => {
    it('should set filters', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setFilters({
          searchQuery: '测试',
          sortBy: 'createdAt'
        });
      });

      expect(result.current.filters.searchQuery).toBe('测试');
      expect(result.current.filters.sortBy).toBe('createdAt');
    });

    it('should set search query', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setSearchQuery('搜索关键词');
      });

      expect(result.current.filters.searchQuery).toBe('搜索关键词');
    });

    it('should set tags filter', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setTagsFilter(['标签1', '标签2']);
      });

      expect(result.current.filters.tags).toEqual(['标签1', '标签2']);
    });

    it('should set sort by', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setSortBy('createdAt');
      });

      expect(result.current.filters.sortBy).toBe('createdAt');
    });
  });

  describe('Todo Operations', () => {
    it('should set todos', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockTodos: TodoItem[] = [
        {
          id: '1',
          content: '测试任务',
          isCompleted: false,
          priority: 'medium',
          noteId: 'note-1',
          createdAt: mockDate,
        }
      ];

      act(() => {
        result.current.setTodos(mockTodos);
      });

      expect(result.current.todos).toEqual(mockTodos);
    });

    it('should add todo', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockTodo: TodoItem = {
        id: '1',
        content: '新任务',
        isCompleted: false,
        priority: 'high',
        noteId: 'note-1',
        createdAt: mockDate,
      };

      act(() => {
        result.current.addTodo(mockTodo);
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0]).toEqual(mockTodo);
    });

    it('should toggle todo completion', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockTodo: TodoItem = {
        id: '1',
        content: '任务',
        isCompleted: false,
        priority: 'medium',
        noteId: 'note-1',
        createdAt: mockDate,
      };

      act(() => {
        result.current.addTodo(mockTodo);
      });

      act(() => {
        result.current.toggleTodo('1');
      });

      expect(result.current.todos[0].isCompleted).toBe(true);
      expect(result.current.todos[0].completedAt).toBeDefined();

      act(() => {
        result.current.toggleTodo('1');
      });

      expect(result.current.todos[0].isCompleted).toBe(false);
      expect(result.current.todos[0].completedAt).toBeUndefined();
    });

    it('should remove todo', () => {
      const { result } = renderHook(() => useNoteStore());
      const mockTodo: TodoItem = {
        id: '1',
        content: '任务',
        isCompleted: false,
        priority: 'medium',
        noteId: 'note-1',
        createdAt: mockDate,
      };

      act(() => {
        result.current.addTodo(mockTodo);
      });

      expect(result.current.todos).toHaveLength(1);

      act(() => {
        result.current.removeTodo('1');
      });

      expect(result.current.todos).toHaveLength(0);
    });
  });

  describe('State Control', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setError('测试错误');
      });

      expect(result.current.error).toBe('测试错误');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setError('测试错误');
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should set AI processing state', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setAIProcessing(true);
      });

      expect(result.current.aiProcessing).toBe(true);
    });

    it('should set AI error state', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setAIError('AI错误');
      });

      expect(result.current.aiError).toBe('AI错误');
    });

    it('should clear AI error', () => {
      const { result } = renderHook(() => useNoteStore());

      act(() => {
        result.current.setAIError('AI错误');
        result.current.clearAIError();
      });

      expect(result.current.aiError).toBe(null);
    });
  });

  describe('AI Functions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should organize note with AI', async () => {
      const { result } = renderHook(() => useNoteStore());

      await act(async () => {
        await result.current.createNote({ title: '原始笔记', content: '原始内容' });
      });

      const noteId = result.current.notes[0].id;

      const organizePromise = act(async () => {
        const promise = result.current.organizeNote(noteId);

        // 快进时间以跳过延迟
        jest.advanceTimersByTime(2000);

        await promise;
      });

      await organizePromise;

      const organizedNote = result.current.notes.find(n => n.id === noteId);
      expect(organizedNote?.title).toBe('AI整理后的标题');
      expect(organizedNote?.content).toContain('AI整理后的内容');
      expect(organizedNote?.tags).toContain('AI整理');
      expect(result.current.aiProcessing).toBe(false);
    });

    it('should extract todos from note', async () => {
      const { result } = renderHook(() => useNoteStore());

      await act(async () => {
        await result.current.createNote({ title: '测试笔记', content: '内容' });
      });

      const noteId = result.current.notes[0].id;

      const extractPromise = act(async () => {
        const promise = result.current.extractTodos(noteId);

        // 快进时间以跳过延迟
        jest.advanceTimersByTime(1500);

        await promise;
      });

      await extractPromise;

      expect(result.current.todos).toHaveLength(2);
      expect(result.current.todos[0].content).toBe('完成项目文档编写');
      expect(result.current.todos[1].content).toBe('进行代码审查');
      expect(result.current.aiProcessing).toBe(false);
    });

    it('should set AI processing state during operations', async () => {
      const { result } = renderHook(() => useNoteStore());

      await act(async () => {
        await result.current.createNote({ title: '测试笔记', content: '内容' });
      });

      const noteId = result.current.notes[0].id;

      act(() => {
        result.current.organizeNote(noteId);
      });

      expect(result.current.aiProcessing).toBe(true);
      expect(result.current.aiError).toBe(null);

      // 快进完成操作
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(result.current.aiProcessing).toBe(false);
    });
  });

  describe('Selector Hooks', () => {
    describe('useFilteredNotes', () => {
      it('should filter notes by search query', async () => {
        const { result: storeResult } = renderHook(() => useNoteStore());
        const { result: filteredResult } = renderHook(() => useFilteredNotes());

        await act(async () => {
          await storeResult.current.createNote({ title: '测试笔记', content: '这是测试内容' });
          await storeResult.current.createNote({ title: '其他笔记', content: '其他内容' });
        });

        act(() => {
          storeResult.current.setSearchQuery('测试');
        });

        expect(filteredResult.current).toHaveLength(1);
        expect(filteredResult.current[0].title).toBe('测试笔记');
      });

      it('should filter notes by tags', async () => {
        const { result: storeResult } = renderHook(() => useNoteStore());
        const { result: filteredResult } = renderHook(() => useFilteredNotes());

        await act(async () => {
          await storeResult.current.createNote({ title: '笔记1', content: '内容1' });
        });

        const noteId = storeResult.current.notes[0].id;

        act(() => {
          storeResult.current.updateNoteInStore(noteId, { tags: ['重要', '工作'] });
          storeResult.current.setTagsFilter(['重要']);
        });

        expect(filteredResult.current).toHaveLength(1);
        expect(filteredResult.current[0].tags).toContain('重要');
      });
    });

    describe('useSelectedNote', () => {
      it('should return selected note', async () => {
        const { result: storeResult } = renderHook(() => useNoteStore());
        const { result: selectedResult } = renderHook(() => useSelectedNote());

        await act(async () => {
          await storeResult.current.createNote({ title: '选中的笔记', content: '内容' });
        });

        expect(selectedResult.current?.title).toBe('选中的笔记');
      });

      it('should return null when no note selected', () => {
        const { result } = renderHook(() => useSelectedNote());

        expect(result.current).toBe(null);
      });
    });

    describe('useNoteTodos', () => {
      it('should return todos for specific note', () => {
        const { result: storeResult } = renderHook(() => useNoteStore());
        const { result: todosResult } = renderHook(() => useNoteTodos('note-1'));

        const mockTodos: TodoItem[] = [
          {
            id: '1',
            content: '任务1',
            isCompleted: false,
            priority: 'medium',
            noteId: 'note-1',
            createdAt: mockDate,
          },
          {
            id: '2',
            content: '任务2',
            isCompleted: false,
            priority: 'high',
            noteId: 'note-2',
            createdAt: mockDate,
          }
        ];

        act(() => {
          storeResult.current.setTodos(mockTodos);
        });

        expect(todosResult.current).toHaveLength(1);
        expect(todosResult.current[0].noteId).toBe('note-1');
      });
    });
  });
});