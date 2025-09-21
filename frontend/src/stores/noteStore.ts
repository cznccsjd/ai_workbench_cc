/**
 * 记事本状态管理
 * 使用Zustand实现状态管理，支持笔记的CRUD操作、AI整理等功能
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Note, NoteState, NoteFilters, TodoItem, CreateNoteData, UpdateNoteData } from '@/types/note';

interface NoteStore extends NoteState {
  // 笔记操作
  createNote: (data: CreateNoteData) => Promise<void>;
  updateNote: (id: string, data: UpdateNoteData) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
  bookmarkNote: (id: string) => Promise<void>;

  // 批量操作
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  updateNoteInStore: (id: string, data: Partial<Note>) => void;

  // 过滤和排序
  setFilters: (filters: Partial<NoteFilters>) => void;
  setSearchQuery: (query: string) => void;
  setTagsFilter: (tags: string[]) => void;
  setSortBy: (sortBy: NoteFilters['sortBy']) => void;

  // Todo操作
  setTodos: (todos: TodoItem[]) => void;
  addTodo: (todo: TodoItem) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;

  // 状态控制
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAIProcessing: (processing: boolean) => void;
  setAIError: (error: string | null) => void;
  clearError: () => void;
  clearAIError: () => void;

  // AI功能
  organizeNote: (id: string) => Promise<void>;
  extractTodos: (id: string) => Promise<void>;
}

const initialFilters: NoteFilters = {
  searchQuery: '',
  tags: [],
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const initialState: NoteState = {
  notes: [],
  selectedNoteId: null,
  todos: [],
  filters: initialFilters,
  isLoading: false,
  error: null,
  aiProcessing: false,
  aiError: null,
};

export const useNoteStore = create<NoteStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 笔记操作
      createNote: async (data: CreateNoteData) => {
        try {
          set({ isLoading: true, error: null });

          // 模拟API调用 - 实际项目中这里会调用真实的API
          const newNote: Note = {
            id: Date.now().toString(),
            title: data.title,
            content: data.content || '',
            isBookmarked: false,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: data.content ? data.content.split(/\s+/).length : 0,
            readingTime: Math.ceil((data.content || '').length / 200), // 假设200字/分钟
          };

          set((state) => ({
            notes: [newNote, ...state.notes],
            selectedNoteId: newNote.id,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建笔记失败',
            isLoading: false
          });
        }
      },

      updateNote: async (id: string, data: UpdateNoteData) => {
        try {
          set({ isLoading: true, error: null });

          set((state) => ({
            notes: state.notes.map(note =>
              note.id === id
                ? {
                    ...note,
                    ...data,
                    updatedAt: new Date(),
                    wordCount: data.content ? data.content.split(/\s+/).length : note.wordCount,
                    readingTime: data.content ? Math.ceil(data.content.length / 200) : note.readingTime,
                  }
                : note
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新笔记失败',
            isLoading: false
          });
        }
      },

      deleteNote: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          set((state) => ({
            notes: state.notes.filter(note => note.id !== id),
            selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除笔记失败',
            isLoading: false
          });
        }
      },

      selectNote: (id: string | null) => {
        set({ selectedNoteId: id });
      },

      bookmarkNote: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          set((state) => ({
            notes: state.notes.map(note =>
              note.id === id
                ? { ...note, isBookmarked: !note.isBookmarked }
                : note
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '收藏笔记失败',
            isLoading: false
          });
        }
      },

      // 批量操作
      setNotes: (notes: Note[]) => {
        set({ notes });
      },

      addNote: (note: Note) => {
        set((state) => ({ notes: [note, ...state.notes] }));
      },

      removeNote: (id: string) => {
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        }));
      },

      updateNoteInStore: (id: string, data: Partial<Note>) => {
        set((state) => ({
          notes: state.notes.map(note =>
            note.id === id ? { ...note, ...data } : note
          ),
        }));
      },

      // 过滤和排序
      setFilters: (filters: Partial<NoteFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      setSearchQuery: (query: string) => {
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        }));
      },

      setTagsFilter: (tags: string[]) => {
        set((state) => ({
          filters: { ...state.filters, tags },
        }));
      },

      setSortBy: (sortBy: NoteFilters['sortBy']) => {
        set((state) => ({
          filters: { ...state.filters, sortBy },
        }));
      },

      // Todo操作
      setTodos: (todos: TodoItem[]) => {
        set({ todos });
      },

      addTodo: (todo: TodoItem) => {
        set((state) => ({ todos: [...state.todos, todo] }));
      },

      toggleTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.map(todo =>
            todo.id === id
              ? {
                  ...todo,
                  isCompleted: !todo.isCompleted,
                  completedAt: !todo.isCompleted ? new Date() : undefined,
                }
              : todo
          ),
        }));
      },

      removeTodo: (id: string) => {
        set((state) => ({
          todos: state.todos.filter(todo => todo.id !== id),
        }));
      },

      // 状态控制
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setAIProcessing: (processing: boolean) => {
        set({ aiProcessing: processing });
      },

      setAIError: (error: string | null) => {
        set({ aiError: error });
      },

      clearError: () => {
        set({ error: null });
      },

      clearAIError: () => {
        set({ aiError: null });
      },

      // AI功能 - 模拟实现
      organizeNote: async (id: string) => {
        try {
          set({ aiProcessing: true, aiError: null });

          // 模拟AI处理延迟
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 模拟AI整理结果
          const mockOrganizedContent = {
            title: 'AI整理后的标题',
            content: '# AI整理后的内容\n\n这是AI自动整理后的笔记内容，结构更加清晰。',
            tags: ['AI整理', '结构化'],
            summary: '这是AI生成的摘要',
          };

          set((state) => ({
            notes: state.notes.map(note =>
              note.id === id
                ? {
                    ...note,
                    title: mockOrganizedContent.title,
                    content: mockOrganizedContent.content,
                    tags: [...new Set([...note.tags, ...mockOrganizedContent.tags])],
                    updatedAt: new Date(),
                  }
                : note
            ),
            aiProcessing: false,
          }));
        } catch (error) {
          set({
            aiError: error instanceof Error ? error.message : 'AI整理失败',
            aiProcessing: false
          });
        }
      },

      extractTodos: async (id: string) => {
        try {
          set({ aiProcessing: true, aiError: null });

          // 模拟AI处理延迟
          await new Promise(resolve => setTimeout(resolve, 1500));

          // 模拟Todo提取结果
          const mockTodos: TodoItem[] = [
            {
              id: `${id}-todo-1`,
              content: '完成项目文档编写',
              isCompleted: false,
              priority: 'high',
              noteId: id,
              createdAt: new Date(),
            },
            {
              id: `${id}-todo-2`,
              content: '进行代码审查',
              isCompleted: false,
              priority: 'medium',
              noteId: id,
              createdAt: new Date(),
            },
          ];

          set((state) => ({
            todos: [...state.todos, ...mockTodos],
            aiProcessing: false,
          }));
        } catch (error) {
          set({
            aiError: error instanceof Error ? error.message : 'Todo提取失败',
            aiProcessing: false
          });
        }
      },
    }),
    {
      name: 'note-store',
    }
  )
);

// 选择器函数
export const useFilteredNotes = () => {
  const { notes, filters } = useNoteStore();

  return notes
    .filter(note => {
      // 搜索过滤
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(note => {
      // 标签过滤
      if (filters.tags.length > 0) {
        return filters.tags.some(tag => note.tags.includes(tag));
      }
      return true;
    })
    .filter(note => {
      // 收藏过滤
      if (filters.isBookmarked !== undefined) {
        return note.isBookmarked === filters.isBookmarked;
      }
      return true;
    })
    .sort((a, b) => {
      // 排序
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
};

export const useSelectedNote = () => {
  const { notes, selectedNoteId } = useNoteStore();
  return notes.find(note => note.id === selectedNoteId) || null;
};

export const useNoteTodos = (noteId: string) => {
  const { todos } = useNoteStore();
  return todos.filter(todo => todo.noteId === noteId);
};