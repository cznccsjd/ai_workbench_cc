/**
 * Todo提取面板组件
 * 显示从笔记中提取的Todo事项，支持管理和操作
 */

'use client';

import { useState, useEffect } from 'react';
import { TodoItem } from '@/types/note';
import { useNoteStore, useNoteTodos } from '@/stores/noteStore';

interface TodoPanelProps {
  noteId: string | null;
  disabled?: boolean;
}

export function TodoPanel({ noteId, disabled = false }: TodoPanelProps) {
  const {
    todos,
    addTodo,
    toggleTodo,
    removeTodo,
    aiProcessing
  } = useNoteStore();

  const [newTodoContent, setNewTodoContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const noteTodos = useNoteTodos(noteId || '');

  const filteredTodos = noteTodos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.isCompleted;
      case 'completed':
        return todo.isCompleted;
      default:
        return true;
    }
  });

  const handleAddTodo = () => {
    if (!newTodoContent.trim() || !noteId) return;

    const newTodo: TodoItem = {
      id: `${noteId}-todo-${Date.now()}`,
      content: newTodoContent.trim(),
      isCompleted: false,
      priority: 'medium',
      noteId,
      createdAt: new Date(),
    };

    addTodo(newTodo);
    setNewTodoContent('');
    setShowAddForm(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTodo();
    }
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getPriorityText = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '中';
    }
  };

  const completedCount = noteTodos.filter(todo => todo.isCompleted).length;
  const totalCount = noteTodos.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!noteId) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h3 className="text-lg font-semibold text-gray-800">Todo面板</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">选择一个笔记查看Todo事项</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Todo事项 ({totalCount})
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={disabled}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            ＋ 添加
          </button>
        </div>

        {/* 进度条 */}
        {totalCount > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>完成进度</span>
              <span>{completedCount}/{totalCount} ({completionRate}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 过滤选项 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'active', label: '待完成' },
            { key: 'completed', label: '已完成' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {label} ({key === 'all' ? totalCount : key === 'active' ? totalCount - completedCount : completedCount})
            </button>
          ))}
        </div>
      </div>

      {/* 添加Todo表单 */}
      {showAddForm && (
        <div className="p-4 border-b bg-blue-50">
          <textarea
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入新的Todo事项..."
            className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
            disabled={disabled}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTodoContent('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleAddTodo}
              disabled={!newTodoContent.trim() || disabled}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Todo列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm text-center">
              {filter === 'all' ? '暂无Todo事项' :
               filter === 'active' ? '没有待完成的Todo' : '没有已完成的Todo'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
              >
                查看全部
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`p-3 border-l-4 transition-all ${
                  todo.isCompleted ? 'bg-gray-50 opacity-75' : getPriorityColor(todo.priority)
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      todo.isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    title={todo.isCompleted ? '标记为未完成' : '标记为已完成'}
                  >
                    {todo.isCompleted && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {todo.content}
                    </p>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full ${
                        todo.priority === 'high' ? 'bg-red-100 text-red-600' :
                        todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {getPriorityText(todo.priority)}优先级
                      </span>
                      <span>{new Date(todo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {totalCount > 0 && (
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
          显示 {filteredTodos.length} 条，共 {totalCount} 条Todo
        </div>
      )}
    </div>
  );
}