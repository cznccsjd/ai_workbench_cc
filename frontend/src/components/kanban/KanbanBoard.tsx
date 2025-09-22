/**
 * 看板主组件
 * 展示看板、列表和卡片的三层次结构
 */

import React, { useEffect, useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useKanbanStore } from '@/stores/kanbanStore';
import ListColumn from './ListColumn';
import KanbanHeader from './KanbanHeader';
import KanbanSidebar from './KanbanSidebar';
import CardModal from './CardModal';
import BoardCreateModal from './BoardCreateModal';
import { Board, Card, List, CardMoveRequest } from '@/types/kanban';
import { PlusIcon } from '@heroicons/react/24/outline';

interface KanbanBoardProps {
  boardId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ boardId }) => {
  const {
    boards,
    fetchBoard,
    createList,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    isLoading,
    error
  } = useKanbanStore();

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const itemType = active.data.current?.type;
    const itemData = active.data.current?.card || active.data.current?.list;

    if (itemType === 'card' && itemData) {
      startDraggingCard(itemData as Card);
    } else if (itemType === 'list' && itemData) {
      startDraggingList(itemData as List);
    }
  }, [startDraggingCard, startDraggingList]);

  // 拖拽结束
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      endDragging();
      return;
    }

    try {
      const activeType = active.data.current?.type;
      const activeData = active.data.current?.card || active.data.current?.list;
      const overType = over.data.current?.type;

      if (activeType === 'card' && activeData) {
        const card = activeData as Card;

        if (overType === 'list') {
          // 卡片移动到不同的列表
          const targetListId = over.id as string;
          const moveData: CardMoveRequest = {
            source_list_id: card.list_id,
            target_list_id: targetListId,
            new_position: 0
          };

          await moveCard(moveData);
        }
      }
    } catch (error) {
      console.error('拖拽操作失败:', error);
      rollbackDragOperation();
    } finally {
      endDragging();
    }
  }, [moveCard, endDragging, rollbackDragOperation]);


  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 获取当前看板数据
  const currentBoard = boards.find(board => board.id === boardId);

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  // 处理卡片点击
  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  // 处理卡片创建
  const handleCardCreate = async (listId: string) => {
    try {
      const newCard = await createCard({
        list_id: listId,
        title: '新卡片',
        description: '',
        priority: 'medium'
      });
      if (newCard) {
        handleCardClick(newCard);
      }
    } catch (error) {
      console.error('创建卡片失败:', error);
    }
  };

  // 处理卡片保存
  const handleCardSave = async (cardData: CardUpdate) => {
    if (selectedCard) {
      try {
        await updateCard(selectedCard.id, cardData);
        setIsCardModalOpen(false);
        setSelectedCard(null);
      } catch (error) {
        console.error('保存卡片失败:', error);
      }
    }
  };

  // 处理卡片删除
  const handleCardDelete = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      setIsCardModalOpen(false);
      setSelectedCard(null);
    } catch (error) {
      console.error('删除卡片失败:', error);
    }
  };

  // 处理卡片移动
  const handleCardMove = async (cardId: string, targetListId: string, newPosition: number) => {
    try {
      await moveCard({
        source_list_id: selectedCard?.list_id || '',
        target_list_id: targetListId,
        new_position: newPosition
      });
    } catch (error) {
      console.error('移动卡片失败:', error);
    }
  };

  // 处理列表创建
  const handleListCreate = async () => {
    if (currentBoard) {
      const listName = prompt('请输入列表名称:');
      if (listName) {
        try {
          await createList({
            board_id: currentBoard.id,
            name: listName,
            position: currentBoard.lists?.length || 0
          });
        } catch (error) {
          console.error('创建列表失败:', error);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">看板不存在</div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-gray-50">
        {/* 头部 */}
        <KanbanHeader
          board={currentBoard}
          onBoardEdit={() => setIsCreateModalOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* 侧边栏 */}
          <KanbanSidebar
            board={currentBoard}
            onCardCreate={handleCardCreate}
          />

          {/* 主内容区 - 列表容器 */}
          <div className="flex-1 overflow-x-auto">
            <div className="h-full flex items-start p-4 space-x-4">
              <SortableContext
                items={currentBoard.lists?.map(list => list.id) || []}
                strategy={horizontalListSortingStrategy}
              >
                {currentBoard.lists?.map((list) => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    cards={list.cards || []}
                    onCardClick={handleCardClick}
                    onCardCreate={handleCardCreate}
                    onCardMove={handleCardMove}
                    onCardDelete={handleCardDelete}
                    isDragging={false}
                  />
                ))}
              </SortableContext>

              {/* 添加列表按钮 */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleListCreate}
                  className="w-80 h-12 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  添加列表
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 拖拽遮罩 */}
        <DragOverlay>
          {draggedCard && (
            <div className="dragging-card">
              <h4 className="text-sm font-medium text-gray-900">{draggedCard.title}</h4>
              {draggedCard.description && (
                <p className="text-xs text-gray-600 mt-1">{draggedCard.description}</p>
              )}
            </div>
          )}
          {draggedList && (
            <div className="dragging-list">
              <h3 className="text-sm font-medium text-gray-900">{draggedList.name}</h3>
            </div>
          )}
        </DragOverlay>

        {/* 卡片编辑模态框 */}
        <CardModal
          card={selectedCard}
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedCard(null);
          }}
          onSave={handleCardSave}
          onDelete={handleCardDelete}
        />

        {/* 看板创建/编辑模态框 */}
        <BoardCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(boardData) => {
            // 这里处理看板更新逻辑
            setIsCreateModalOpen(false);
          }}
        />
      </div>
    </DndContext>
  );
};

export default KanbanBoard;