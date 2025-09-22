/**
 * 列表列组件
 * 显示列表及其卡片，支持卡片拖拽和列表操作
 */

'use client';

import { useState, useCallback } from 'react';
import {
  EllipsisVerticalIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { List, Card } from '@/types/kanban';
import CardItem from './CardItem';

interface ListColumnProps {
  list: List;
  cards: Card[];
  onCardClick: (card: Card) => void;
  onCardCreate: (listId: string, cardData: any) => void;
  onListEdit: (listId: string, listData: any) => void;
  onListDelete: (listId: string) => void;
  onCardMove: (cardId: string, targetListId: string, newPosition: number) => void;
  onCardDelete: (cardId: string) => void;
}

export default function ListColumn({
  list,
  cards,
  onCardClick,
  onCardCreate,
  onListEdit,
  onListDelete,
  onCardMove,
  onCardDelete
}: ListColumnProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [listName, setListName] = useState(list.name);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  // 配置列表拖拽 - 优化移动端体验
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list,
      position: list.position
    },
    disabled: false,
    animateLayoutChanges: () => true,
    resizeObserverConfig: {
      disabled: false,
    },
  });

  // 计算拖拽时的样式
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleListNameEdit = () => {
    setIsEditingName(true);
    setIsMenuOpen(false);
  };

  const handleListNameSave = async () => {
    if (listName.trim() && listName !== list.name) {
      await onListEdit(list.id, { name: listName.trim() });
    }
    setIsEditingName(false);
  };

  const handleListNameCancel = () => {
    setListName(list.name);
    setIsEditingName(false);
  };

  const handleListDelete = useCallback(() => {
    if (window.confirm('确定要删除这个列表吗？列表中的所有卡片也将被删除。')) {
      onListDelete(list.id);
    }
    setIsMenuOpen(false);
  }, [onListDelete, list.id]);

  const handleCardCreate = async () => {
    if (newCardTitle.trim()) {
      await onCardCreate(list.id, {
        title: newCardTitle.trim(),
        position: cards.length
      });
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const getCompletedCount = () => {
    return cards.filter(card => card.is_completed).length;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-80 bg-gray-50 rounded-lg p-4 flex flex-col max-h-full ${
        isDragging ? 'shadow-lg opacity-75 rotate-1 z-40 dragging-list' : 'draggable-hover'
      }`}
      role="group"
      aria-label={`列表：${list.name}`}
    >
      {/* 列表头部 */}
      <div className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing touch-manipulation" {...attributes} {...listeners}>
        {isEditingName ? (
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleListNameSave();
                } else if (e.key === 'Escape') {
                  handleListNameCancel();
                }
              }}
            />
            <div className="flex space-x-1">
              <button
                onClick={handleListNameSave}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
              >
                ✓
              </button>
              <button
                onClick={handleListNameCancel}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              {list.name}
              <span className="ml-2 text-xs text-gray-500">
                ({cards.length - getCompletedCount()}/{cards.length})
              </span>
            </h3>
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>

              {/* 下拉菜单 */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={handleListNameEdit}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      重命名
                    </button>
                    <button
                      onClick={handleListDelete}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 卡片列表 */}
      <div className="flex-1 space-y-3 min-h-[100px]">
        <SortableContext
          items={cards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              listId={list.id}
              onClick={() => onCardClick(card)}
              onEdit={(card) => onCardClick(card)}
              onDelete={onCardDelete}
              isDragging={false}
            />
          ))}
        </SortableContext>
      </div>

      {/* 添加卡片 */}
      <div className="mt-4">
        {!isAddingCard ? (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-md border border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            添加卡片
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="输入卡片标题..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCardCreate();
                } else if (e.key === 'Escape') {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCardCreate}
                disabled={!newCardTitle.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加卡片
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        )}
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