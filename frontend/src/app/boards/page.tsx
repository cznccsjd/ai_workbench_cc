/**
 * 看板列表页面
 * 显示用户所有看板，支持创建、编辑、删除看板
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useKanbanStore } from '@/stores/kanbanStore';
import { Board } from '@/types/kanban';
import BoardList from '@/components/kanban/BoardList';
import BoardCreateModal from '@/components/kanban/BoardCreateModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function BoardsPage() {
  const router = useRouter();
  const {
    boards,
    isLoading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    setCurrentBoard
  } = useKanbanStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleBoardClick = (board: Board) => {
    setCurrentBoard(board.id);
    router.push(`/boards/${board.id}`);
  };

  const handleBoardEdit = async (board: Board) => {
    try {
      await updateBoard(board.id, {
        name: board.name,
        description: board.description,
        background_color: board.background_color
      });
    } catch (error) {
      console.error('编辑看板失败:', error);
    }
  };

  const handleBoardDelete = async (boardId: string) => {
    if (window.confirm('确定要删除这个看板吗？此操作不可恢复。')) {
      try {
        await deleteBoard(boardId);
      } catch (error) {
        console.error('删除看板失败:', error);
      }
    }
  };

  const handleCreateBoard = async (boardData: any) => {
    try {
      const newBoard = await createBoard(boardData);
      if (newBoard) {
        setIsCreateModalOpen(false);
        handleBoardClick(newBoard);
      }
    } catch (error) {
      console.error('创建看板失败:', error);
    }
  };

  if (isLoading && boards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">项目管理看板</h1>
              <p className="mt-1 text-sm text-gray-600">
                管理您的项目，跟踪任务进度
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              创建看板
            </button>
          </div>
        </div>
      </div>

      {/* 错误消息 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <ErrorMessage message={error} onClose={() => {}} />
        </div>
      )}

      {/* 看板列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BoardList
          boards={boards}
          onBoardClick={handleBoardClick}
          onBoardEdit={handleBoardEdit}
          onBoardDelete={handleBoardDelete}
        />

        {boards.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <PlusIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有看板</h3>
            <p className="text-gray-600 mb-4">创建您的第一个看板开始管理项目</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              创建看板
            </button>
          </div>
        )}
      </div>

      {/* 创建看板模态框 */}
      <BoardCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBoard}
      />
    </div>
  );
}