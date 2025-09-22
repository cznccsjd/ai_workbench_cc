/**
 * 看板头部组件
 * 显示看板标题、统计信息和操作按钮
 */

'use client';

import { useState } from 'react';
import {
  ArrowLeftIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Board } from '@/types/kanban';

interface BoardHeaderProps {
  board: Board | null;
  onBoardUpdate: (boardData: any) => void;
  onBackClick: () => void;
}

export default function BoardHeader({
  board,
  onBoardUpdate,
  onBackClick
}: BoardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [boardName, setBoardName] = useState(board?.name || '');

  if (!board) return null;

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleBoardNameEdit = () => {
    setIsEditingName(true);
    setBoardName(board.name);
    setIsMenuOpen(false);
  };

  const handleBoardNameSave = async () => {
    if (boardName.trim() && boardName !== board.name) {
      await onBoardUpdate({ name: boardName.trim() });
    }
    setIsEditingName(false);
  };

  const handleBoardNameCancel = () => {
    setIsEditingName(false);
    setBoardName(board.name);
  };

  const getBoardStats = () => {
    const totalCards = board.lists?.reduce((sum, list) => sum + (list.cards?.length || 0), 0) || 0;
    const completedCards = board.lists?.reduce((sum, list) => {
      return sum + (list.cards?.filter(card => card.is_completed).length || 0);
    }, 0) || 0;
    const overdueCards = board.lists?.reduce((sum, list) => {
      return sum + (list.cards?.filter(card => {
        return card.due_date && new Date(card.due_date) < new Date() && !card.is_completed;
      }).length || 0);
    }, 0) || 0;

    return { totalCards, completedCards, overdueCards };
  };

  const stats = getBoardStats();
  const completionRate = stats.totalCards > 0 ? Math.round((stats.completedCards / stats.totalCards) * 100) : 0;

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* 左侧：返回按钮和标题 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackClick}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
              title="返回看板列表"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: board.background_color || '#6B7280' }}
              />

              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleBoardNameSave();
                      } else if (e.key === 'Escape') {
                        handleBoardNameCancel();
                      }
                    }}
                  />
                  <div className="flex space-x-1">
                    <button
                      onClick={handleBoardNameSave}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleBoardNameCancel}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {board.name}
                  </h1>
                  {board.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {board.description}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 右侧：统计信息和操作 */}
          <div className="flex items-center space-x-6">
            {/* 统计信息 */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{stats.totalCards}</div>
                <div className="text-gray-600">总卡片</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{completionRate}%</div>
                <div className="text-gray-600">完成率</div>
              </div>

              {stats.overdueCards > 0 && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{stats.overdueCards}</div>
                  <div className="text-gray-600">逾期</div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-2">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                title="看板统计"
              >
                <ChartBarIcon className="h-5 w-5" />
              </button>

              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                title="看板设置"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>

                {/* 下拉菜单 */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={handleBoardNameEdit}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PencilIcon className="h-4 w-4 mr-3" />
                        编辑看板
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ChartBarIcon className="h-4 w-4 mr-3" />
                        看板统计
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-3" />
                        看板设置
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={handleMenuClose}
        />
      )}
    </div>
  );
}