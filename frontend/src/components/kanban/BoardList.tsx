/**
 * 看板列表组件
 * 显示用户所有看板，支持看板的基本操作
 */

'use client';

import { useState } from 'react';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Board } from '@/types/kanban';
import { formatDate } from '@/lib/utils';

interface BoardListProps {
  boards: Board[];
  onBoardClick: (board: Board) => void;
  onBoardEdit: (board: Board) => void;
  onBoardDelete: (boardId: string) => void;
}

export default function BoardList({
  boards,
  onBoardClick,
  onBoardEdit,
  onBoardDelete
}: BoardListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleMenuToggle = (boardId: string) => {
    setOpenMenuId(openMenuId === boardId ? null : boardId);
  };

  const handleMenuClose = () => {
    setOpenMenuId(null);
  };

  const getBoardStats = (board: Board) => {
    const totalCards = board.lists?.reduce((sum, list) => sum + (list.cards?.length || 0), 0) || 0;
    const completedCards = board.lists?.reduce((sum, list) => {
      return sum + (list.cards?.filter(card => card.is_completed).length || 0);
    }, 0) || 0;

    return { totalCards, completedCards };
  };

  const getBackgroundStyle = (board: Board) => {
    if (board.background_image) {
      return {
        backgroundImage: `url(${board.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    return {
      backgroundColor: board.background_color || '#f3f4f6'
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {boards.map((board) => {
        const stats = getBoardStats(board);
        const isMenuOpen = openMenuId === board.id;

        return (
          <div
            key={board.id}
            className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* 看板头部背景 */}
            <div
              className="h-32 relative cursor-pointer"
              style={getBackgroundStyle(board)}
              onClick={() => onBoardClick(board)}
            >
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuToggle(board.id);
                  }}
                  className="p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 shadow-sm"
                >
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
                </button>

                {/* 下拉菜单 */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClose();
                          onBoardEdit(board);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PencilIcon className="h-4 w-4 mr-3" />
                        编辑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClose();
                          onBoardDelete(board.id);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <TrashIcon className="h-4 w-4 mr-3" />
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-4">
                <h3 className="text-lg font-semibold text-white drop-shadow-lg">
                  {board.name}
                </h3>
              </div>
            </div>

            {/* 看板信息 */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {board.description || '暂无描述'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    <span>{stats.totalCards} 卡片</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600">{stats.completedCards} 完成</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <time dateTime={board.created_at}>
                    {formatDate(board.created_at)}
                  </time>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 点击外部关闭菜单 */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={handleMenuClose}
        />
      )}
    </div>
  );
}