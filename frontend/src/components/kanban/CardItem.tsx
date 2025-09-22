/**
 * 卡片项组件
 * 显示卡片基本信息，支持优先级显示和拖拽
 */

'use client';

import { useState, useCallback } from 'react';
import {
  CalendarIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/types/kanban';
import { formatDate, isOverdue } from '@/lib/utils';

interface CardItemProps {
  card: Card;
  listId: string;
  onClick: (card: Card) => void;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  isDragging?: boolean;
}

export default function CardItem({
  card,
  listId,
  onClick,
  onEdit,
  onDelete,
  isDragging: externalIsDragging
}: CardItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 配置拖拽 - 优化移动端体验
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      listId,
      position: card.position
    },
    disabled: false, // 允许拖拽
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

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // 防止拖拽时触发点击
    if (isDragging) return;

    e.preventDefault();
    e.stopPropagation();
    onClick(card);
  }, [onClick, card, isDragging]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="h-3 w-3" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-3 w-3" />;
      case 'medium':
        return <ClockIcon className="h-3 w-3" />;
      case 'low':
        return <CheckCircleIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const isCardOverdue = card.due_date && isOverdue(card.due_date) && !card.is_completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-200 ${
        isDragging ? 'shadow-lg opacity-75 z-50 transform rotate-1' : 'cursor-pointer'
      } ${
        externalIsDragging ? 'pointer-events-none' : ''
      } ${
        card.is_completed ? 'opacity-75' : ''
      } ${
        isCardOverdue ? 'border-red-300 bg-red-50' : ''
      } ${
        isDragging ? 'dragging-card' : 'draggable-hover'
      }`}
      onClick={handleCardClick}
      style={{
        ...style,
        ...(card.color ? { borderLeft: `4px solid ${card.color}` } : {})
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(card);
        }
      }}
      aria-label={`卡片：${card.title}`}
    >
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-2">
        <h4 className={`text-sm font-medium text-gray-900 flex-1 ${
          card.is_completed ? 'line-through' : ''
        }`}>
          {card.title}
        </h4>
        {card.is_completed && (
          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
        )}
      </div>

      {/* 卡片描述 */}
      {card.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* 标签 */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* 优先级 */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getPriorityColor(card.priority)}`}>
            {getPriorityIcon(card.priority)}
            <span className="ml-1 capitalize">{card.priority}</span>
          </span>

          {/* 截止日期 */}
          {card.due_date && (
            <span className={`inline-flex items-center ${
              isCardOverdue ? 'text-red-600 font-medium' : ''
            }`}>
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formatDate(card.due_date)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 拖拽手柄 */}
          <div
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing drag-handle touch-manipulation"
            {...listeners}
            aria-label="拖拽卡片"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}