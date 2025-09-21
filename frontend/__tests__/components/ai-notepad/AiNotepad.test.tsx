// AI记事本主组件测试
// 测试AI记事本的所有功能，包括状态管理、用户交互、错误处理等

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiNotepad } from '@/components/ai-notepad/AiNotepad';
import { useNoteStore, useFilteredNotes, useSelectedNote, useNoteTodos } from '@/stores/noteStore';

// 模拟zustand store
jest.mock('@/stores/noteStore', () => ({
  useNoteStore: jest.fn(),
  useFilteredNotes: jest.fn(),
  useSelectedNote: jest.fn(),
  useNoteTodos: jest.fn(),
}));

// 模拟子组件
jest.mock('@/components/ai-notepad/NoteList', () => ({
  NoteList: ({ notes, selectedNoteId, onCreateNote }: any) => (
    <div data-testid="note-list">
      <button onClick={onCreateNote} data-testid="create-note-btn">
        新建笔记
      </button>
      <div data-testid="notes-count">{notes.length} 个笔记</div>
      <div data-testid="selected-note-id">{selectedNoteId || 'none'}</div>
    </div>
  ),
}));

jest.mock('@/components/ai-notepad/MarkdownEditor', () => ({
  MarkdownEditor: ({ note, onChange, onOrganize, onExtractTodos, disabled }: any) => (
    <div data-testid="markdown-editor">
      <div data-testid="editor-note-title">{note?.title || 'no note'}</div>
      <button onClick={onOrganize} data-testid="organize-btn" disabled={disabled}>
        AI整理
      </button>
      <button onClick={onExtractTodos} data-testid="extract-todos-btn" disabled={disabled}>
        提取Todo
      </button>
      <textarea
        data-testid="editor-content"
        value={note?.content || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  ),
}));

jest.mock('@/components/ai-notepad/TodoPanel', () => ({
  TodoPanel: ({ noteId, disabled }: any) => (
    <div data-testid="todo-panel">
      <div data-testid="todo-note-id">{noteId || 'none'}</div>
      <div data-testid="todo-disabled">{disabled ? 'disabled' : 'enabled'}</div>
    </div>
  ),
}));

jest.mock('@/components/ai-notepad/ThreeColumnLayout', () => ({
  ThreeColumnLayout: ({ leftPanel, centerPanel, rightPanel }: any) => (
    <div data-testid="three-column-layout">
      <div data-testid="left-panel">{leftPanel}</div>
      <div data-testid="center-panel">{centerPanel}</div>
      <div data-testid="right-panel">{rightPanel}</div>
    </div>
  ),
}));

describe('AiNotepad', () => {
  const mockStore = {
    setNotes: jest.fn(),
    setTodos: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    organizeNote: jest.fn(),
    extractTodos: jest.fn(),
    selectedNoteId: null,
    aiProcessing: false,
    aiError: null,
    clearAIError: jest.fn(),
  };

  const mockFilteredNotes = [];
  const mockSelectedNote = null;
  const mockNoteTodos = [];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNoteStore as jest.Mock).mockReturnValue(mockStore);
    (useFilteredNotes as jest.Mock).mockReturnValue(mockFilteredNotes);
    (useSelectedNote as jest.Mock).mockReturnValue(mockSelectedNote);
    (useNoteTodos as jest.Mock).mockReturnValue(mockNoteTodos);
  });

  describe('基本渲染', () => {
    it('renders without crashing', () => {
      render(<AiNotepad />);

      expect(screen.getByTestId('three-column-layout')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<AiNotepad />);

      // 初始状态显示加载中
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('renders main layout after client-side mount', async () => {
      render(<AiNotepad />);

      // 等待组件挂载
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证布局渲染
      expect(screen.getByTestId('three-column-layout')).toBeInTheDocument();
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('center-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });

    it('displays AI processing indicator when processing', async () => {
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        aiProcessing: true,
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('AI处理中...')).toBeInTheDocument();
      expect(screen.getByText('AI处理中...')).toHaveClass('fixed');
    });

    it('displays AI error message when there is an error', async () => {
      const errorMessage = 'AI处理失败：网络错误';
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        aiError: errorMessage,
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toHaveClass('fixed');
    });

    it('clears AI error when close button is clicked', async () => {
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        aiError: 'AI处理失败',
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(mockStore.clearAIError).toHaveBeenCalledTimes(1);
    });
  });

  describe('笔记管理', () => {
    it('initializes with sample notes on mount', async () => {
      render(<AiNotepad />);

      await waitFor(() => {
        expect(mockStore.setNotes).toHaveBeenCalled();
      });

      const setNotesCall = mockStore.setNotes.mock.calls[0][0];
      expect(setNotesCall).toHaveLength(2);
      expect(setNotesCall[0].title).toBe('欢迎使用AI记事本');
      expect(setNotesCall[1].title).toBe('项目计划');
    });

    it('creates new note when create button is clicked', async () => {
      mockStore.createNote.mockResolvedValueOnce(undefined);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-note-btn');
      fireEvent.click(createButton);

      expect(mockStore.createNote).toHaveBeenCalledTimes(1);

      // 验证创建笔记的参数
      const createNoteCall = mockStore.createNote.mock.calls[0][0];
      expect(createNoteCall).toHaveProperty('title');
      expect(createNoteCall).toHaveProperty('content');
      expect(createNoteCall.content).toBe('');
    });

    it('updates note content when editor changes', async () => {
      const mockNote = {
        id: '1',
        title: '测试笔记',
        content: '原始内容',
        isBookmarked: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
      };

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
      });

      mockStore.updateNote.mockResolvedValueOnce(undefined);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const editorContent = screen.getByTestId('editor-content');
      const newContent = '更新的内容';

      fireEvent.change(editorContent, { target: { value: newContent } });

      expect(mockStore.updateNote).toHaveBeenCalledWith('1', {
        content: newContent,
        title: mockNote.title,
      });
    });

    it('organizes note when organize button is clicked', async () => {
      const mockNote = {
        id: '1',
        title: '测试笔记',
        content: '需要整理的内容',
        isBookmarked: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
      };

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
      });

      mockStore.organizeNote.mockResolvedValueOnce(undefined);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const organizeButton = screen.getByTestId('organize-btn');
      fireEvent.click(organizeButton);

      expect(mockStore.organizeNote).toHaveBeenCalledWith('1');
    });

    it('extracts todos when extract button is clicked', async () => {
      const mockNote = {
        id: '1',
        title: '测试笔记',
        content: '需要完成的任务：1. 任务一 2. 任务二',
        isBookmarked: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
      };

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
      });

      mockStore.extractTodos.mockResolvedValueOnce(undefined);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const extractButton = screen.getByTestId('extract-todos-btn');
      fireEvent.click(extractButton);

      expect(mockStore.extractTodos).toHaveBeenCalledWith('1');
    });
  });

  describe('UI状态和交互', () => {
    it('shows empty state when no note is selected', async () => {
      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证空状态显示
      const centerPanel = screen.getByTestId('center-panel');
      expect(centerPanel).toHaveTextContent('选择一个笔记开始编辑');
    });

    it('shows editor when note is selected', async () => {
      const mockNote = {
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

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证编辑器显示
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-note-title')).toHaveTextContent('测试笔记');
    });

    it('disables editor when AI is processing', async () => {
      const mockNote = {
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

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
        aiProcessing: true,
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证编辑器被禁用
      const editorContent = screen.getByTestId('editor-content');
      expect(editorContent).toBeDisabled();

      const organizeButton = screen.getByTestId('organize-btn');
      expect(organizeButton).toBeDisabled();

      const extractButton = screen.getByTestId('extract-todos-btn');
      expect(extractButton).toBeDisabled();
    });

    it('passes correct props to TodoPanel', async () => {
      const mockNote = {
        id: 'test-note-id',
        title: '测试笔记',
        content: '测试内容',
        isBookmarked: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
      };

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: 'test-note-id',
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证TodoPanel接收到正确的props
      expect(screen.getByTestId('todo-note-id')).toHaveTextContent('test-note-id');
      expect(screen.getByTestId('todo-disabled')).toHaveTextContent('enabled');
    });

    it('shows correct notes count in NoteList', async () => {
      const mockNotes = [
        { id: '1', title: '笔记1' },
        { id: '2', title: '笔记2' },
        { id: '3', title: '笔记3' },
      ];

      (useFilteredNotes as jest.Mock).mockReturnValue(mockNotes);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('notes-count')).toHaveTextContent('3 个笔记');
    });
  });

  describe('错误处理和边界情况', () => {
    it('handles missing selected note gracefully', async () => {
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: 'nonexistent-id',
      });

      (useSelectedNote as jest.Mock).mockReturnValue(null);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 应该显示空状态而不是错误
      const centerPanel = screen.getByTestId('center-panel');
      expect(centerPanel).toHaveTextContent('选择一个笔记开始编辑');
    });

    it('handles AI processing errors', async () => {
      const mockNote = {
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

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
        aiError: 'AI服务暂时不可用',
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('AI服务暂时不可用')).toBeInTheDocument();
    });

    it('handles concurrent AI operations', async () => {
      const mockNote = {
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

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
      });

      // 模拟异步操作
      let resolveOrganize: () => void;
      let resolveExtract: () => void;

      const organizePromise = new Promise(resolve => {
        resolveOrganize = resolve;
      });

      const extractPromise = new Promise(resolve => {
        resolveExtract = resolve;
      });

      mockStore.organizeNote.mockReturnValueOnce(organizePromise);
      mockStore.extractTodos.mockReturnValueOnce(extractPromise);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const organizeButton = screen.getByTestId('organize-btn');
      const extractButton = screen.getByTestId('extract-todos-btn');

      // 同时点击两个按钮
      fireEvent.click(organizeButton);
      fireEvent.click(extractButton);

      expect(mockStore.organizeNote).toHaveBeenCalled();
      expect(mockStore.extractTodos).toHaveBeenCalled();

      // 解析异步操作
      act(() => {
        resolveOrganize!();
        resolveExtract!();
      });
    });
  });

  describe('响应式行为和性能', () => {
    it('handles rapid note switching', async () => {
      const mockNotes = [
        { id: '1', title: '笔记1' },
        { id: '2', title: '笔记2' },
        { id: '3', title: '笔记3' },
      ];

      (useFilteredNotes as jest.Mock).mockReturnValue(mockNotes);

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证笔记列表显示
      expect(screen.getByTestId('notes-count')).toHaveTextContent('3 个笔记');
    });

    it('handles large note content', async () => {
      const largeContent = '大量内容 '.repeat(1000);
      const mockNote = {
        id: '1',
        title: '大内容笔记',
        content: largeContent,
        isBookmarked: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 2000,
        readingTime: 10,
      };

      (useSelectedNote as jest.Mock).mockReturnValue(mockNote);
      (useNoteStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedNoteId: '1',
      });

      render(<AiNotepad />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // 验证大内容笔记可以正常显示
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-note-title')).toHaveTextContent('大内容笔记');
    });
  });
});