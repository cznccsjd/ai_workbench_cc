/**
 * 看板视图组件
 * 显示看板内容，支持列表和卡片的拖拽操作
 */

'use client';

import { useState, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Board, Card } from '@/types/kanban';
import ListColumn from './ListColumn';
import CardModal from './CardModal';

interface BoardViewProps {
  board: Board;
  onListCreate: (listData: { board_id: string; name: string; position?: number }) => void;
  onListUpdate: (listId: string, listData: { name?: string; description?: string; position?: number; is_archived?: boolean }) => void;
  onListDelete: (listId: string) => void;
  onCardCreate: (listId: string, cardData: { list_id: string; title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent' }) => void;
  onCardUpdate: (cardId: string, cardData: { title?: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; is_completed?: boolean }) => void;
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

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  }, []);

  const handleCardModalClose = () => {
    setSelectedCard(null);
    setIsCardModalOpen(false);
  };

  const handleCardSave = async (cardData: { title?: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; is_completed?: boolean }) => {
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
    <div className="flex-1 overflow-x-auto bg-background p-4">
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
              className="w-full h-full min-h-[100px] bg-card bg-opacity-80 hover:bg-opacity-100 rounded-lg border-2 border-dashed border-border hover:border-primary transition-all duration-200 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              添加列表
            </button>
          ) : (
            <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="输入列表名称"
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-ring focus:border-ring mb-3 bg-background text-foreground"
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
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加列表
                </button>
                <button
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListName('');
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80"
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
    </div>
  );
}