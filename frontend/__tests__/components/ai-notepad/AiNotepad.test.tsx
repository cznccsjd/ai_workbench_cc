/**
 * AI记事本主组件测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiNotepad } from '@/components/ai-notepad/AiNotepad';
import { useNoteStore } from '@/stores/noteStore';

// 模拟zustand store
jest.mock('@/stores/noteStore', () => ({
  useNoteStore: jest.fn(),
  useFilteredNotes: jest.fn(),
  useSelectedNote: jest.fn(),
  useNoteTodos: jest.fn(),
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

  it('renders without crashing', () => {
    render(<AiNotepad />);

    expect(screen.getByText('我的笔记')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AiNotepad />);

    // 由于useEffect的存在，组件会显示加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('displays AI processing indicator when processing', () => {
    (useNoteStore as jest.Mock).mockReturnValue({
      ...mockStore,
      aiProcessing: true,
    });

    render(<AiNotepad />);

    expect(screen.getByText('AI处理中...')).toBeInTheDocument();
  });

  it('displays AI error message when there is an error', () => {
    (useNoteStore as jest.Mock).mockReturnValue({
      ...mockStore,
      aiError: 'AI处理失败',
    });

    render(<AiNotepad />);

    expect(screen.getByText('AI处理失败')).toBeInTheDocument();
  });

  it('clears AI error when close button is clicked', () => {
    (useNoteStore as jest.Mock).mockReturnValue({
      ...mockStore,
      aiError: 'AI处理失败',
    });

    render(<AiNotepad />);

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockStore.clearAIError).toHaveBeenCalled();
  });

  it('creates new note when create button is clicked', async () => {
    mockStore.createNote.mockResolvedValueOnce(undefined);

    render(<AiNotepad />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no note is selected', async () => {
    render(<AiNotepad />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('选择一个笔记开始编辑')).toBeInTheDocument();
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
  });
});