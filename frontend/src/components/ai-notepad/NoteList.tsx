/**
 * 笔记列表组件
 * 显示所有笔记，支持搜索、过滤、排序等功能
 */

'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { useNoteStore, useFilteredNotes } from '@/stores/noteStore';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onCreateNote: () => void;
}

export function NoteList({ notes, selectedNoteId, onCreateNote }: NoteListProps) {
  const {
    selectNote,
    bookmarkNote,
    setSearchQuery,
    setTagsFilter,
    setSortBy,
    filters
  } = useNoteStore();

  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState(filters.tags);

  // 获取所有标签
  const allTags = Array.from(
    new Set(notes.flatMap(note => note.tags))
  ).sort();

  // 搜索延迟处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

  const handleNoteSelect = (noteId: string) => {
    selectNote(noteId);
  };

  const handleBookmark = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await bookmarkNote(noteId);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    setTagsFilter(newTags);
  };

  const handleSortChange = (sortBy: Note['updatedAt' | 'createdAt' | 'title']) => {
    setSortBy(sortBy);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return noteDate.toLocaleDateString('zh-CN');
    }
  };

  const filteredNotes = useFilteredNotes();

  return (
    <div className="flex flex-col h-full">
      {/* 头部工具栏 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            我的笔记 ({notes.length})
          </h3>
          <button
            onClick={onCreateNote}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-colors"
          >
            ＋ 新建笔记
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索笔记标题、内容或标签..."
            className="w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <div className="absolute left-2.5 top-2.5 text-gray-400">🔍</div>
        </div>

        {/* 过滤和排序选项 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <span>🔽</span>
            <span>筛选</span>
          </button>

          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updatedAt">按修改时间</option>
            <option value="createdAt">按创建时间</option>
            <option value="title">按标题</option>
          </select>
        </div>

        {/* 展开的过滤选项 */}
        {showFilters && (
          <div className="mt-3 p-3 bg-white rounded-md border">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">标签筛选</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {allTags.length === 0 && (
                  <span className="text-xs text-gray-500">暂无标签</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.isBookmarked === true}
                  onChange={(e) => {
                    const bookmarked = e.target.checked ? true : undefined;
                    setFilters({ isBookmarked: bookmarked });
                  }}
                  className="rounded"
                />
                <span>仅显示收藏</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">{searchInput || selectedTags.length > 0 ? '没有找到匹配的笔记' : '还没有笔记'}</p>
            {(searchInput || selectedTags.length > 0) && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSelectedTags([]);
                  setTagsFilter([]);
                }}
                className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
              >
                清除筛选
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleNoteSelect(note.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedNoteId === note.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 line-clamp-1 flex-1">
                    {note.title}
                  </h4>
                  <button
                    onClick={(e) => handleBookmark(e, note.id)}
                    className={`ml-2 text-lg ${
                      note.isBookmarked ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    title={note.isBookmarked ? '取消收藏' : '收藏'}
                  >
                    ⭐
                  </button>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {note.content || '暂无内容'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span>{formatDate(note.updatedAt)}</span>
                    <span>{note.wordCount}字</span>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {note.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="text-gray-400">+{note.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
        共 {notes.length} 条笔记，显示 {filteredNotes.length} 条
      </div>
    </div>
  );
}