/**
 * AI记事本主组件
 * 实现三栏布局：笔记列表 | 编辑器 | Todo面板
 */

'use client';

import { useEffect, useState } from 'react';
import { useNoteStore, useFilteredNotes, useSelectedNote } from '@/stores/noteStore';
import { NoteList } from './NoteList';
import { MarkdownEditor } from './MarkdownEditor';
import { TodoPanel } from './TodoPanel';
import { ThreeColumnLayout } from './ThreeColumnLayout';
import { Note } from '@/types/note';

export function AiNotepad() {
  const {
    setNotes,
    setTodos,
    createNote,
    updateNote,
    organizeNote,
    extractTodos,
    selectedNoteId,
    aiProcessing,
    aiError,
    clearAIError
  } = useNoteStore();

  const filteredNotes = useFilteredNotes();
  const selectedNote = useSelectedNote();
  const [isClient, setIsClient] = useState(false);

  // 防止服务端渲染不匹配
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化示例数据
  useEffect(() => {
    const mockNotes: Note[] = [
      {
        id: '1',
        title: '欢迎使用AI记事本',
        content: '# 欢迎使用AI记事本\n\n这是一个智能的笔记管理工具，具有以下功能：\n\n## 核心功能\n\n- **AI智能整理**: 自动整理笔记内容，优化结构\n- **Todo提取**: 从笔记中智能提取待办事项\n- **实时编辑**: 支持Markdown格式的实时编辑\n- **标签管理**: 灵活的标签分类系统\n\n## 使用方法\n\n1. 点击"新建笔记"创建新的笔记\n2. 在编辑器中输入内容，支持Markdown语法\n3. 使用AI功能整理笔记或提取Todo\n4. 通过标签和搜索功能管理笔记\n\n开始记录你的想法吧！ 🚀',
        isBookmarked: true,
        tags: ['欢迎', '使用指南'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        wordCount: 120,
        readingTime: 1,
      },
      {
        id: '2',
        title: '项目计划',
        content: '# 项目开发计划\n\n## 第一阶段 - MVP功能\n\n- [ ] 完成基础笔记功能\n- [ ] 实现Markdown编辑器\n- [ ] 添加AI整理功能\n- [ ] 实现Todo提取\n\n## 第二阶段 - 增强功能\n\n- [ ] 添加协作功能\n- [ ] 实现版本控制\n- [ ] 优化AI算法\n- [ ] 添加导出功能\n\n## 第三阶段 - 高级功能\n\n- [ ] 实现全文搜索\n- [ ] 添加数据可视化\n- [ ] 支持多语言\n- [ ] 移动端适配',
        isBookmarked: false,
        tags: ['项目', '计划'],
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02'),
        wordCount: 85,
        readingTime: 1,
      },
    ];

    setNotes(mockNotes);
  }, [setNotes]);

  const handleCreateNote = async () => {
    const timestamp = Date.now();
    await createNote({
      title: `新笔记 ${new Date(timestamp).toLocaleString()}`,
      content: '',
    });
  };

  const handleUpdateNote = async (content: string) => {
    if (!selectedNote) return;

    await updateNote(selectedNote.id, {
      content,
      title: selectedNote.title,
    });
  };

  const handleOrganizeNote = async () => {
    if (!selectedNote) return;

    await organizeNote(selectedNote.id);
  };

  const handleExtractTodos = async () => {
    if (!selectedNote) return;

    await extractTodos(selectedNote.id);
  };

  const handleAIClose = () => {
    clearAIError();
  };

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* AI处理状态指示器 */}
      {aiProcessing && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>AI处理中...</span>
          </div>
        </div>
      )}

      {/* AI错误提示 */}
      {aiError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between space-x-4">
            <span>{aiError}</span>
            <button
              onClick={handleAIClose}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <ThreeColumnLayout
        leftPanel={
          <NoteList
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            onCreateNote={handleCreateNote}
          />
        }
        centerPanel={
          selectedNote ? (
            <MarkdownEditor
              note={selectedNote}
              onChange={handleUpdateNote}
              onOrganize={handleOrganizeNote}
              onExtractTodos={handleExtractTodos}
              disabled={aiProcessing}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">📝</div>
                <p className="text-gray-500">选择一个笔记开始编辑</p>
                <p className="text-gray-400 text-sm mt-1">或创建新的笔记</p>
              </div>
            </div>
          )
        }
        rightPanel={
          <TodoPanel
            noteId={selectedNote?.id || null}
            disabled={aiProcessing}
          />
        }
      />
    </div>
  );
}