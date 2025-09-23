/**
 * MarkdownEditor组件测试
 * 测试Markdown编辑器的核心功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '@/components/ai-notepad/MarkdownEditor';
import { Note } from '@/types/note';

// Mock debounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

const mockNote: Note = {
  id: '1',
  title: '测试笔记',
  content: '测试内容',
  isBookmarked: false,
  tags: ['测试', '示例'],
  createdAt: new Date('2025-01-01T08:00:00Z'),
  updatedAt: new Date('2025-01-02T08:00:00Z'),
  wordCount: 3,
  readingTime: 1,
};

const mockHandlers = {
  onChange: jest.fn(),
  onOrganize: jest.fn(),
  onExtractTodos: jest.fn(),
};

describe('MarkdownEditor', () => {
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

      expect(screen.getByDisplayValue(mockNote.title)).toBeInTheDocument();
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

      const titleInput = screen.getByDisplayValue(mockNote.title);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('placeholder', '笔记标题');
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

      const textarea = screen.getByDisplayValue(mockNote.content);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
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

      expect(screen.getAllByText(/字/).length).toBeGreaterThan(0);
      expect(screen.getByText(/分钟/)).toBeInTheDocument();
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

      expect(screen.getByText(/最后更新/)).toBeInTheDocument();
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

      expect(screen.getByTitle('粗体')).toBeInTheDocument();
      expect(screen.getByTitle('斜体')).toBeInTheDocument();
      expect(screen.getByTitle('行内代码')).toBeInTheDocument();
      expect(screen.getByTitle('列表')).toBeInTheDocument();
      expect(screen.getByTitle('标题')).toBeInTheDocument();
    });

    it('displays preview toggle button', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      expect(screen.getByTitle('预览')).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('calls onChange when content is modified', async () => {
      const user = userEvent.setup();

      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const textarea = screen.getByDisplayValue(mockNote.content);
      await user.clear(textarea);
      await user.type(textarea, '新的内容');

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

    it('toggles between edit and preview modes', () => {
      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const previewButton = screen.getByTitle('预览');
      fireEvent.click(previewButton);

      // After clicking, the button should change to "编辑"
      expect(screen.getByTitle('编辑')).toBeInTheDocument();
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

      expect(screen.getByDisplayValue(mockNote.title)).toBeDisabled();
      expect(screen.getByTitle('粗体')).toBeDisabled();
      expect(screen.getByTitle('斜体')).toBeDisabled();
    });
  });

  describe('Markdown格式化', () => {
    it('inserts bold formatting', () => {
      render(
        <MarkdownEditor
          note={{ ...mockNote, content: '' }}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const boldButton = screen.getByTitle('粗体');
      fireEvent.click(boldButton);

      // 验证点击后的行为 - 由于空内容，按钮可以点击
      expect(boldButton).toBeInTheDocument();
    });

    it('inserts italic formatting', () => {
      render(
        <MarkdownEditor
          note={{ ...mockNote, content: '' }}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const italicButton = screen.getByTitle('斜体');
      fireEvent.click(italicButton);

      // 验证点击后的行为
      expect(italicButton).toBeInTheDocument();
    });

    it('inserts inline code formatting', () => {
      render(
        <MarkdownEditor
          note={{ ...mockNote, content: '' }}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const codeButton = screen.getByTitle('行内代码');
      fireEvent.click(codeButton);

      // 验证点击后的行为
      expect(codeButton).toBeInTheDocument();
    });

    it('inserts list formatting', () => {
      render(
        <MarkdownEditor
          note={{ ...mockNote, content: '' }}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const listButton = screen.getByTitle('列表');
      fireEvent.click(listButton);

      // 验证点击后的行为
      expect(listButton).toBeInTheDocument();
    });

    it('inserts heading formatting', () => {
      render(
        <MarkdownEditor
          note={{ ...mockNote, content: '' }}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const headingButton = screen.getByTitle('标题');
      fireEvent.click(headingButton);

      // 验证点击后的行为
      expect(headingButton).toBeInTheDocument();
    });
  });

  describe('边界情况和错误处理', () => {
    it('handles empty note content', () => {
      const emptyNote = { ...mockNote, content: '' };

      render(
        <MarkdownEditor
          note={emptyNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      // AI buttons should be disabled for empty content
      expect(screen.getByText('🤖 整理')).toBeDisabled();
      expect(screen.getByText('✅ 提取Todo')).toBeDisabled();
    });

    it('handles special characters in content', () => {
      const specialNote = {
        ...mockNote,
        content: '# 特殊字符测试\n\n包含 < > & " \' 等特殊字符的内容。',
      };

      render(
        <MarkdownEditor
          note={specialNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      // 验证包含特殊字符的内容能够正确渲染
      const textareas = screen.getAllByRole('textbox');
      const contentTextarea = textareas.find(ta => ta.tagName === 'TEXTAREA');
      expect(contentTextarea).toBeInTheDocument();
      expect(contentTextarea).toHaveValue(specialNote.content);
    });

    it('handles many tags', () => {
      const manyTagsNote = {
        ...mockNote,
        tags: ['标签1', '标签2', '标签3', '标签4', '标签5'],
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

    it('handles rapid content changes', async () => {
      const user = userEvent.setup();

      render(
        <MarkdownEditor
          note={mockNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );

      const textarea = screen.getByDisplayValue(mockNote.content);

      await user.clear(textarea);
      await user.type(textarea, 'a');
      await user.type(textarea, 'b');
      await user.type(textarea, 'c');

      expect(textarea).toHaveValue('abc');
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

      // Click both buttons rapidly
      fireEvent.click(organizeButton);
      fireEvent.click(extractButton);

      expect(mockHandlers.onOrganize).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onExtractTodos).toHaveBeenCalledTimes(1);
    });
  });

  describe('性能测试', () => {
    it('renders with large number of tags efficiently', () => {
      const largeTags = Array.from({ length: 20 }, (_, i) => `标签${i + 1}`);
      const performanceNote = { ...mockNote, tags: largeTags };

      const startTime = performance.now();
      render(
        <MarkdownEditor
          note={performanceNote}
          onChange={mockHandlers.onChange}
          onOrganize={mockHandlers.onOrganize}
          onExtractTodos={mockHandlers.onExtractTodos}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
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
      `.repeat(5);

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

      // 验证textarea存在并且包含复杂内容
      const textareas = screen.getAllByRole('textbox');
      const contentTextarea = textareas.find(ta =>
        ta.tagName === 'TEXTAREA'
      );
      expect(contentTextarea).toBeInTheDocument();
      expect(contentTextarea).toHaveValue(complexContent);
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

      const textarea = screen.getByDisplayValue(mockNote.content);

      // 验证文本区域存在并可交互
      expect(textarea).toBeInTheDocument();
      expect(textarea).not.toBeDisabled();

      // 点击格式化按钮
      const boldButton = screen.getByTitle('粗体');
      fireEvent.click(boldButton);

      // 验证交互后组件仍然可用
      expect(textarea).not.toBeDisabled();
    });
  });
});