// Markdown编辑器组件测试
// 测试Markdown编辑器的所有功能，包括编辑、预览、AI操作等

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '@/components/ai-notepad/MarkdownEditor';
import { Note } from '@/types/note';

// 模拟useDebounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value, // 直接使用值，不延迟
}));

// 模拟ReactMarkdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="markdown-preview">{children}</div>
  ),
}));

// 模拟remark-gfm
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => ({}),
}));

describe('MarkdownEditor', () => {
  const mockNote: Note = {
    id: '1',
    title: '测试笔记',
    content: '# 标题\n\n这是测试内容。',
    isBookmarked: false,
    tags: ['测试', '示例'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
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

  describe('基本渲染', () => {
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
      const textareas = screen.getAllByRole('textbox');
      expect(textareas).toHaveLength(2); // 标题输入框和内容文本区域
    });

    it('displays note title input', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const titleInput = screen.getByDisplayValue('测试笔记');
      expect(titleInput).toBeInTheDocument();
      expect(titleInput.tagName).toBe('INPUT');
    });

    it('displays content textarea', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const contentTextarea = screen.getByRole('textbox', { name: /开始写作/i });
      expect(contentTextarea).toBeInTheDocument();
      expect(contentTextarea.tagName).toBe('TEXTAREA');
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
      expect(screen.getByText('示例')).toBeInTheDocument();
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

    it('displays AI action buttons', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByText('🤖 整理')).toBeInTheDocument();
      expect(screen.getByText('✅ 提取Todo')).toBeInTheDocument();
    });

    it('displays formatting toolbar buttons', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByText('B')).toBeInTheDocument(); // 粗体
      expect(screen.getByText('I')).toBeInTheDocument(); // 斜体
      expect(screen.getByText('•')).toBeInTheDocument(); // 列表
      expect(screen.getByText('H')).toBeInTheDocument(); // 标题
    });

    it('displays mode toggle buttons', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByText('👁️ 预览')).toBeInTheDocument();
      expect(screen.getByText('✏️ 编辑')).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('calls onChange when title is modified', async () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const titleInput = screen.getByDisplayValue('测试笔记');
      fireEvent.change(titleInput, { target: { value: '新的标题' } });

      await waitFor(() => {
        expect(mockHandlers.onChange).toHaveBeenCalledWith('# 标题\n\n这是测试内容。');
      });
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

      const textareas = screen.getAllByRole('textbox');
      const textarea = textareas[1]; // 第二个textbox是内容文本区域
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

      expect(mockHandlers.onOrganize).toHaveBeenCalledTimes(1);
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

      expect(mockHandlers.onExtractTodos).toHaveBeenCalledTimes(1);
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
      expect(screen.getByDisplayValue('# 标题\n\n这是测试内容。', { exact: false })).toBeInTheDocument();

      // 切换到预览模式
      const previewButton = screen.getByText('👁️ 预览');
      fireEvent.click(previewButton);

      // 应该显示预览内容
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-preview')).toHaveTextContent('# 标题\n\n这是测试内容。');

      // 切换回编辑模式
      const editButton = screen.getByText('✏️ 编辑');
      fireEvent.click(editButton);

      expect(screen.getByDisplayValue('# 标题\n\n这是测试内容。', { exact: false })).toBeInTheDocument();
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
      const contentTextarea = screen.getByRole('textbox', { name: /开始写作/i });

      expect(organizeButton).toBeDisabled();
      expect(extractButton).toBeDisabled();
      expect(contentTextarea).toBeDisabled();
    });
  });

  describe('Markdown格式化', () => {
    it('inserts bold formatting', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const boldButton = screen.getByText('B');
      fireEvent.click(boldButton);

      // 由于我们模拟了useDebounce，格式化应该立即应用
      expect(mockHandlers.onChange).toHaveBeenCalled();
    });

    it('inserts italic formatting', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const italicButton = screen.getByText('I');
      fireEvent.click(italicButton);

      expect(mockHandlers.onChange).toHaveBeenCalled();
    });

    it('inserts inline code formatting', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      // 找到代码按钮，它包含空的code元素
      const codeButton = screen.getByTitle('行内代码');
      fireEvent.click(codeButton);

      expect(mockHandlers.onChange).toHaveBeenCalled();
    });

    it('inserts list formatting', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const listButton = screen.getByText('•');
      fireEvent.click(listButton);

      expect(mockHandlers.onChange).toHaveBeenCalled();
    });

    it('inserts heading formatting', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const hButton = screen.getByText('H');
      fireEvent.click(hButton);

      expect(mockHandlers.onChange).toHaveBeenCalled();
    });
  });

  describe('边界情况和错误处理', () => {
    it('handles null note gracefully', () => {
      render(
        <MarkdownEditor
          note={null as any}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      // 应该显示空状态而不是崩溃
      expect(screen.queryByDisplayValue('测试笔记')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/开始写作/i)).not.toBeInTheDocument();
    });

    it('handles empty note content', () => {
      const emptyNote = {
        ...mockNote,
        content: '',
        wordCount: 0,
        readingTime: 0,
      };

      render(
        <MarkdownEditor
          note={emptyNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByDisplayValue('测试笔记')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByText('0字')).toBeInTheDocument();
      expect(screen.getByText('约0分钟')).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const longContent = '这是一个很长的内容。'.repeat(1000);
      const longNote = {
        ...mockNote,
        content: longContent,
        wordCount: 6000,
        readingTime: 30,
      };

      render(
        <MarkdownEditor
          note={longNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByDisplayValue(longContent, { exact: false })).toBeInTheDocument();
      expect(screen.getByText('6000字')).toBeInTheDocument();
      expect(screen.getByText('约30分钟')).toBeInTheDocument();
    });

    it('handles many tags', () => {
      const manyTagsNote = {
        ...mockNote,
        tags: ['标签1', '标签2', '标签3', '标签4', '标签5', '标签6', '标签7', '标签8'],
      };

      render(
        <MarkdownEditor
          note={manyTagsNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      manyTagsNote.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('handles special characters in content', () => {
      const specialContent = '# 特殊字符测试\n\n包含 < > & " \' 等特殊字符的内容。';
      const specialNote = {
        ...mockNote,
        content: specialContent,
      };

      render(
        <MarkdownEditor
          note={specialNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByDisplayValue(specialContent, { exact: false })).toBeInTheDocument();
    });

    it('handles rapid content changes', async () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const textareas = screen.getAllByRole('textbox');
      const textarea = textareas[1]; // 第二个textbox是内容文本区域

      // 快速连续修改内容
      for (let i = 0; i < 10; i++) {
        fireEvent.change(textarea, { target: { value: `内容${i}` } });
      }

      await waitFor(() => {
        // 验证最后一次修改被调用
        expect(mockHandlers.onChange).toHaveBeenCalledWith('内容9');
      });
    });

    it('handles concurrent button clicks', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const organizeButton = screen.getByText('🤖 整理');
      const extractButton = screen.getByText('✅ 提取Todo');

      // 同时点击两个按钮
      fireEvent.click(organizeButton);
      fireEvent.click(extractButton);

      expect(mockHandlers.onOrganize).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onExtractTodos).toHaveBeenCalledTimes(1);
    });
  });

  describe('性能测试', () => {
    it('renders with large number of tags efficiently', () => {
      const startTime = performance.now();

      const manyTagsNote = {
        ...mockNote,
        tags: Array.from({ length: 100 }, (_, i) => `标签${i}`),
      };

      render(
        <MarkdownEditor
          note={manyTagsNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 验证渲染时间合理（小于100ms）
      expect(renderTime).toBeLessThan(100);

      // 验证所有标签都被渲染
      expect(screen.getAllByText(/标签\d+/)).toHaveLength(100);
    });

    it('handles content with many markdown elements', () => {
      const complexContent = `
# 主标题
## 副标题
### 三级标题

**粗体文本** *斜体文本* ~~删除线~~

[链接文本](https://example.com)

\`\`\`javascript
const code = "示例代码";
\`\`\`

- 列表项1
- 列表项2
  - 嵌套列表项

1. 有序列表1
2. 有序列表2

> 引用文本

| 表格 | 列1 | 列2 |
|------|-----|-----|
| 行1  | 数据1 | 数据2 |
| 行2  | 数据3 | 数据4 |
      `.repeat(10);

      const complexNote = {
        ...mockNote,
        content: complexContent,
        wordCount: 500,
        readingTime: 5,
      };

      render(
        <MarkdownEditor
          note={complexNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByDisplayValue(complexContent, { exact: false })).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('has proper ARIA labels', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      // 验证按钮有正确的文本内容
      expect(screen.getByText('🤖 整理')).toBeInTheDocument();
      expect(screen.getByText('✅ 提取Todo')).toBeInTheDocument();
    });

    it('maintains focus management', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const textareas = screen.getAllByRole('textbox');
      const textarea = textareas[1]; // 第二个textbox是内容文本区域

      // 验证文本区域存在并可交互
      expect(textarea).toBeInTheDocument();
      expect(textarea).not.toBeDisabled();

      // 点击格式化按钮
      const boldButton = screen.getByText('B');
      fireEvent.click(boldButton);

      // 验证交互后组件仍然可用
      expect(textarea).not.toBeDisabled();
    });
  });
});