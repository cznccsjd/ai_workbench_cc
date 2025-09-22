/**
 * 看板视图组件
 * 显示看板内容，支持列表和卡片的拖拽操作
 */

'use client';

import { useState, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Board, List, Card } from '@/types/kanban';
import ListColumn from './ListColumn';
import CardModal from './CardModal';

interface BoardViewProps {
  board: Board;
  onListCreate: (listData: any) => void;
  onListUpdate: (listId: string, listData: any) => void;
  onListDelete: (listId: string) => void;
  onCardCreate: (listId: string, cardData: any) => void;
  onCardUpdate: (cardId: string, cardData: any) => void;
  onCardDelete: (cardId: string) => void;
  onCardMove: (cardId: string, targetListId: string, newPosition: number) => void;
}

export default function BoardView({
  board,
  onListCreate,
  onListUpdate,
  onListDelete,
  onCardCreate,
  onCardUpdate,
  onCardDelete,
  onCardMove
}: BoardViewProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const [isDragging, setIsDragging] = useState(false);

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  }, []);

  const handleCardModalClose = () => {
    setSelectedCard(null);
    setIsCardModalOpen(false);
  };

  const handleCardSave = async (cardData: any) => {
    if (selectedCard) {
      await onCardUpdate(selectedCard.id, cardData);
    }
    handleCardModalClose();
  };

  const handleListCreate = async () => {
    if (newListName.trim()) {
      await onListCreate({
        name: newListName.trim(),
        position: board.lists?.length || 0
      });
      setNewListName('');
      setIsAddingList(false);
    }
  };

  return (
    <DragContext>
      <div className="flex-1 overflow-x-auto bg-gray-100 p-4">
        <div className="flex gap-4 min-h-full">
          {board.lists?.map((list) => (
            <div key={list.id} className="flex-shrink-0">
              <ListColumn
                list={list}
                cards={list.cards || []}
                onCardClick={handleCardClick}
                onCardCreate={onCardCreate}
                onListEdit={onListUpdate}
                onListDelete={onListDelete}
                onCardMove={onCardMove}
              />
            </div>
          ))}

          {/* 添加新列表 */}
          <div className="flex-shrink-0 w-80">
            {!isAddingList ? (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full h-full min-h-[100px] bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-gray-800"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                添加列表
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="输入列表名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-3"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleListCreate();
                    } else if (e.key === 'Escape') {
                      setIsAddingList(false);
                      setNewListName('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleListCreate}
                    disabled={!newListName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加列表
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListName('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 卡片详情模态框 */}
        <CardModal
          card={selectedCard}
          isOpen={isCardModalOpen}
          onClose={handleCardModalClose}
          onSave={handleCardSave}
          onDelete={onCardDelete}
        />

        {/* 拖拽遮罩 */}
        <DragOverlayComponent />
      </div>
    </DragContext>
  );
}