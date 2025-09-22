/**
 * 可拖拽卡片组件
 * 基于@dnd-kit/sortable实现卡片拖拽
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardItem from './CardItem';
import { Card } from '@/types/kanban';

interface SortableCardProps {
  card: Card;
  listId: string;
  onClick: (card: Card) => void;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  isDragging?: boolean;
}

const SortableCard: React.FC<SortableCardProps> = ({
  card,
  listId,
  onClick,
  onEdit,
  onDelete,
  isDragging: isGlobalDragging
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isLocalDragging
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      listId
    }
  });

  const isDragging = isLocalDragging || isGlobalDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="select-none"
    >
      <CardItem
        card={card}
        listId={listId}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
};

export default SortableCard;