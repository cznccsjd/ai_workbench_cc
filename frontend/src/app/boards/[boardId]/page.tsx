/**
 * 看板详情页面
 * 显示看板内容，支持列表和卡片管理
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useKanbanStore } from '@/stores/kanbanStore';
import { Board } from '@/types/kanban';
import BoardView from '@/components/kanban/BoardView';
import BoardHeader from '@/components/kanban/BoardHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;

  const {
    boards,
    currentBoardId,
    isLoading,
    error,
    fetchBoard,
    setCurrentBoard,
    updateBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    moveCard
  } = useKanbanStore();

  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
      setCurrentBoard(boardId);
    }
  }, [boardId, fetchBoard, setCurrentBoard]);

  useEffect(() => {
    const foundBoard = boards.find(b => b.id === boardId);
    setBoard(foundBoard || null);
  }, [boards, boardId]);

  const handleBoardUpdate = async (boardData: any) => {
    try {
      await updateBoard(boardId, boardData);
    } catch (error) {
      console.error('更新看板失败:', error);
    }
  };

  const handleListCreate = async (listData: any) => {
    try {
      await createList({
        ...listData,
        board_id: boardId
      });
    } catch (error) {
      console.error('创建列表失败:', error);
    }
  };

  const handleListUpdate = async (listId: string, listData: any) => {
    try {
      await updateList(listId, listData);
    } catch (error) {
      console.error('更新列表失败:', error);
    }
  };

  const handleListDelete = async (listId: string) => {
    if (window.confirm('确定要删除这个列表吗？列表中的所有卡片也将被删除。')) {
      try {
        await deleteList(listId);
      } catch (error) {
        console.error('删除列表失败:', error);
      }
    }
  };

  const handleCardCreate = async (listId: string, cardData: any) => {
    try {
      await createCard({
        ...cardData,
        list_id: listId
      });
    } catch (error) {
      console.error('创建卡片失败:', error);
    }
  };

  const handleCardUpdate = async (cardId: string, cardData: any) => {
    try {
      await updateCard(cardId, cardData);
    } catch (error) {
      console.error('更新卡片失败:', error);
    }
  };

  const handleCardDelete = async (cardId: string) => {
    if (window.confirm('确定要删除这张卡片吗？')) {
      try {
        await deleteCard(cardId);
      } catch (error) {
        console.error('删除卡片失败:', error);
      }
    }
  };

  const handleCardMove = async (cardId: string, targetListId: string, newPosition: number) => {
    try {
      await moveCard({
        source_list_id: '',
        target_list_id: targetListId,
        new_position: newPosition,
        card_id: cardId
      });
    } catch (error) {
      console.error('移动卡片失败:', error);
    }
  };

  const handleBackToBoards = () => {
    router.push('/boards');
  };

  if (isLoading && !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!board && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">看板不存在</h2>
          <p className="text-gray-600 mb-4">您访问的看板可能已被删除或不存在</p>
          <button
            onClick={handleBackToBoards}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回看板列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 看板头部 */}
      <BoardHeader
        board={board}
        onBoardUpdate={handleBoardUpdate}
        onBackClick={handleBackToBoards}
      />

      {/* 错误消息 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <ErrorMessage message={error} onClose={() => {}} />
        </div>
      )}

      {/* 看板视图 */}
      {board && (
        <BoardView
          board={board}
          onListCreate={handleListCreate}
          onListUpdate={handleListUpdate}
          onListDelete={handleListDelete}
          onCardCreate={handleCardCreate}
          onCardUpdate={handleCardUpdate}
          onCardDelete={handleCardDelete}
          onCardMove={handleCardMove}
        />
      )}
    </div>
  );
}