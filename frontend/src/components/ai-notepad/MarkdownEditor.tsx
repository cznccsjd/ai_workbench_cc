/**
 * Markdown编辑器组件
 * 支持实时预览、AI功能按钮等特性
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Note } from '@/types/note';
import { useDebounce } from '@/hooks/useDebounce';

interface MarkdownEditorProps {
  note: Note;
  onChange: (content: string) => void;
  onOrganize: () => void;
  onExtractTodos: () => void;
  disabled?: boolean;
}

export function MarkdownEditor({
  note,
  onChange,
  onOrganize,
  onExtractTodos,
  disabled = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(note.content);
  const [isPreview, setIsPreview] = useState(false);
  const [showWordCount, setShowWordCount] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedContent = useDebounce(content, 500);

  // 自动保存
  useEffect(() => {
    if (debouncedContent !== note.content) {
      onChange(debouncedContent);
    }
  }, [debouncedContent, note.content, onChange]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 更新标题逻辑会在父组件中处理
    const newTitle = e.target.value;
    if (newTitle !== note.title) {
      // 这里可以添加标题更新逻辑
      console.log('标题更新:', newTitle);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // 重新聚焦并设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // 简单的Markdown渲染实现
    return text
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 代码块
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded"><code>$1</code></pre>')
      // 行内代码
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline">$1</a>')
      // 列表
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      // 换行
      .replace(/\n/g, '<br/>');
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // 假设200字/分钟

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            defaultValue={note.title}
            onChange={handleTitleChange}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 flex-1"
            placeholder="笔记标题"
            disabled={disabled}
          />
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {showWordCount && (
              <>
                <span>{wordCount}字</span>
                <span>•</span>
                <span>约{readingTime}分钟</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* AI功能按钮 */}
          <button
            onClick={onOrganize}
            disabled={disabled || !content.trim()}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="AI智能整理"
          >
            🤖 整理
          </button>

          <button
            onClick={onExtractTodos}
            disabled={disabled || !content.trim()}
            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="提取Todo事项"
          >
            ✅ 提取Todo
          </button>

          <div className="w-px h-4 bg-gray-300"></div>

          {/* Markdown工具按钮 */}
          <button
            onClick={() => insertMarkdown('**', '**')}
            disabled={disabled}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            title="粗体"
          >
            <strong>B</strong>
          </button>

          <button
            onClick={() => insertMarkdown('*', '*')}
            disabled={disabled}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 italic"
            title="斜体"
          >
            I
          </button>

          <button
            onClick={() => insertMarkdown('`', '`')}
            disabled={disabled}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 font-mono"
            title="行内代码"
          >
            <code></code>
          </button>

          <button
            onClick={() => insertMarkdown('\n* ', '')}
            disabled={disabled}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            title="列表"
          >
            •
          </button>

          <button
            onClick={() => insertMarkdown('## ', '')}
            disabled={disabled}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            title="标题"
          >
            H
          </button>

          <div className="w-px h-4 bg-gray-300"></div>

          {/* 预览切换 */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
            title={isPreview ? '编辑' : '预览'}
          >
            {isPreview ? '✏️ 编辑' : '👁️ 预览'}
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-6 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="开始写作...支持Markdown语法\n\n快捷操作：\n**粗体** *斜体* `代码` \n# 标题 \n* 列表项\n[链接文本](URL)"
            className="w-full h-full p-6 resize-none border-none outline-none font-mono text-sm leading-relaxed"
            disabled={disabled}
          />
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between p-3 border-t text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>最后更新: {new Date(note.updatedAt).toLocaleString()}</span>
          {note.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWordCount(!showWordCount)}
            className="hover:text-gray-700"
            title="显示/隐藏字数统计"
          >
            {showWordCount ? '👁️' : '🙈'}
          </button>
          {showWordCount && (
            <span>{wordCount} 字</span>
          )}
        </div>
      </div>
    </div>
  );
}