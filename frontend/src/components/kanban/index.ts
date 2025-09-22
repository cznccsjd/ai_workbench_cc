/**
 * 看板组件库导出
 */

// 主组件
export { default as BoardList } from './BoardList';
export { default as BoardView } from './BoardView';
export { default as BoardHeader } from './BoardHeader';

// 模态框组件
export { default as BoardCreateModal } from './BoardCreateModal';
export { default as CardModal } from './CardModal';

// 列表和卡片组件
export { default as ListColumn } from './ListColumn';
export { default as CardItem } from './CardItem';

// 原有组件（保持兼容性）
export { default as KanbanBoard } from './KanbanBoard';
export { default as KanbanBoardsList } from './KanbanBoardsList';
export { default as BoardCard } from './BoardCard';
export { default as KanbanHeader } from './KanbanHeader';
export { default as KanbanSidebar } from './KanbanSidebar';
export { default as KanbanFilters } from './KanbanFilters';
export { default as KanbanStats } from './KanbanStats';
export { default as SortableCard } from './SortableCard';
export { default as SortableList } from './SortableList';
export { default as DragPlaceholder } from './DragPlaceholder';