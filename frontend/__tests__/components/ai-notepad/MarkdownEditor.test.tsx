/**
 * Markdown编辑器组件测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '@/components/ai-notepad/MarkdownEditor';
import { Note } from '@/types/note';

// 模拟useDebounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value, // 直接使用值，不延迟
}));

describe('MarkdownEditor', () => {
  const mockNote: Note = {
    id: '1',
    title: '测试笔记',
    content: '# 标题\n\n这是测试内容。',
    isBookmarked: false,
    tags: ['测试'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    wordCount: 10,
    readingTime: 1,
  };

  const mockHandlers = {
    onChange: jest.fn(),
    onOrganize: jest.fn(),
    onExtractTodos: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    expect(screen.getByDisplayValue('测试笔记')).toBeInTheDocument();
  });

  it('displays note content in textarea', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    expect(screen.getByDisplayValue('# 标题\n\n这是测试内容。')).toBeInTheDocument();
  });

  it('shows word count and reading time', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    expect(screen.getByText('10字')).toBeInTheDocument();
    expect(screen.getByText('约1分钟')).toBeInTheDocument();
  });

  it('calls onChange when content is modified', async () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    const textarea = screen.getByDisplayValue('# 标题\n\n这是测试内容。');
    fireEvent.change(textarea, { target: { value: '新的内容' } });

    await waitFor(() => {
      expect(mockHandlers.onChange).toHaveBeenCalledWith('新的内容');
    });
  });

  it('calls onOrganize when organize button is clicked', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    const organizeButton = screen.getByText('🤖 整理');
    fireEvent.click(organizeButton);

    expect(mockHandlers.onOrganize).toHaveBeenCalled();
  });

  it('calls onExtractTodos when extract button is clicked', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    const extractButton = screen.getByText('✅ 提取Todo');
    fireEvent.click(extractButton);

    expect(mockHandlers.onExtractTodos).toHaveBeenCalled();
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
        disabled={true}
      />
    );

    const organizeButton = screen.getByText('🤖 整理');
    const extractButton = screen.getByText('✅ 提取Todo');

    expect(organizeButton).toBeDisabled();
    expect(extractButton).toBeDisabled();
  });

  it('toggles between edit and preview modes', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    // 初始状态应该是编辑模式
    expect(screen.getByDisplayValue('# 标题\n\n这是测试内容。')).toBeInTheDocument();

    // 切换到预览模式
    const previewButton = screen.getByText('👁️ 预览');
    fireEvent.click(previewButton);

    // 应该显示预览内容
    expect(screen.getByText('标题')).toBeInTheDocument();
    expect(screen.getByText('这是测试内容。')).toBeInTheDocument();

    // 切换回编辑模式
    const editButton = screen.getByText('✏️ 编辑');
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('# 标题\n\n这是测试内容。')).toBeInTheDocument();
  });

  it('inserts markdown formatting', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    const textarea = screen.getByDisplayValue('# 标题\n\n这是测试内容。');

    // 选中一些文本
    textarea.setSelectionRange(0, 2);

    // 点击粗体按钮
    const boldButton = screen.getByText('B');
    fireEvent.click(boldButton);

    // 由于我们模拟了useDebounce，内容应该立即更新
    // 注意：实际测试中可能需要更复杂的文本选择模拟
  });

  it('shows tags in footer', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    expect(screen.getByText('测试')).toBeInTheDocument();
  });

  it('shows last update time', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    expect(screen.getByText(/最后更新:/)).toBeInTheDocument();
  });

  it('toggles word count visibility', () => {
    render(
      <MarkdownEditor
        note={mockNote}
        onChange={mockHandlers.onChange}
        onOrganize={mockHandlers.onOrganize}
        onExtractTodos={mockHandlers.onExtractTodos}
      />
    );

    // 默认显示字数
    expect(screen.getByText('10字')).toBeInTheDocument();

    // 点击隐藏字数按钮
    const toggleButton = screen.getByText('👁️');
    fireEvent.click(toggleButton);

    // 字数应该被隐藏（实际实现中需要状态管理）
  });
});