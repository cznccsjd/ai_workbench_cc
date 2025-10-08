/**
 * 项目管理看板类型定义
 */

// 枚举定义
export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum CardStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  ARCHIVED = 'archived'
}

// ===== 基础接口 =====
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ===== 看板接口 =====
export interface Board extends BaseEntity {
  user_id: string;
  name: string;
  description?: string;
  background_color: string;
  background_image?: string;
  is_archived: boolean;
  position: number;
  lists?: List[];
}

export interface BoardCreate {
  name: string;
  description?: string;
  background_color?: string;
  background_image?: string;
}

export interface BoardUpdate {
  name?: string;
  description?: string;
  background_color?: string;
  background_image?: string;
  is_archived?: boolean;
}

// ===== 列表接口 =====
export interface List extends BaseEntity {
  board_id: string;
  name: string;
  description?: string;
  position: number;
  is_archived: boolean;
  cards?: Card[];
}

export interface ListCreate {
  board_id: string;
  name: string;
  description?: string;
  position?: number;
}

export interface ListUpdate {
  name?: string;
  description?: string;
  position?: number;
  is_archived?: boolean;
}

// ===== 卡片接口 =====
export interface Card extends BaseEntity {
  list_id: string;
  title: string;
  description?: string;
  position: number;
  due_date?: string;
  priority: PriorityLevel;
  is_completed: boolean;
  is_archived: boolean;
  color?: string;
  tags: string[];
  completed_at?: string;
}

export interface CardCreate {
  list_id: string;
  title: string;
  description?: string;
  position?: number;
  due_date?: string;
  priority?: PriorityLevel;
  color?: string;
  tags?: string[];
}

export interface CardUpdate {
  title?: string;
  description?: string;
  position?: number;
  due_date?: string;
  priority?: PriorityLevel;
  is_completed?: boolean;
  color?: string;
  tags?: string[];
}

// ===== 拖拽操作接口 =====
export interface CardMoveRequest {
  card_id: string;
  source_list_id: string;
  target_list_id: string;
  new_position: number;
}

export interface DragState {
  draggedCard: Card | null;
  draggedList: List | null;
  dragOverListId: string | null;
  isDragging: boolean;
}

// ===== 批量操作接口 =====
export interface BulkCardUpdate {
  card_ids: string[];
  updates: CardUpdate;
}

export interface BulkCardMove {
  card_ids: string[];
  target_list_id: string;
}

// ===== 搜索和过滤接口 =====
export interface CardFilter {
  list_ids?: string[];
  priorities?: PriorityLevel[];
  is_completed?: boolean;
  has_due_date?: boolean;
  is_overdue?: boolean;
  tags?: string[];
}

export interface SearchRequest {
  query: string;
  board_id?: string;
  include_archived?: boolean;
}

export interface SearchResponse {
  cards: Card[];
  total_count: number;
  query: string;
}

// ===== 看板统计接口 =====
export interface BoardStats {
  total_cards: number;
  completed_cards: number;
  overdue_cards: number;
  cards_by_priority: Record<PriorityLevel, number>;
  cards_by_list: Record<string, number>;
}

// ===== 组件属性接口 =====
export interface BoardCardProps {
  board: Board;
  onClick: (board: Board) => void;
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export interface ListColumnProps {
  list: List;
  cards: Card[];
  onCardClick: (card: Card) => void;
  onCardCreate: (listId: string) => void;
  onListEdit: (list: List) => void;
  onListDelete: (listId: string) => void;
  onCardMove: (cardId: string, targetListId: string, newPosition: number) => void;
}

export interface CardItemProps {
  card: Card;
  listId: string;
  onClick: (card: Card) => void;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  isDragging?: boolean;
}

export interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: CardUpdate) => void;
  onDelete: (cardId: string) => void;
}

export interface BoardCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (boardData: BoardCreate) => void;
}

// ===== 拖拽相关接口 =====
export interface DragItem {
  id: string;
  type: 'card' | 'list';
  data: Card | List;
}

export interface DropResult {
  destinationId: string;
  position: number;
  type: 'card' | 'list';
}

export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: {
        type: string;
        card?: Card;
        list?: List;
      };
    };
  };
  over: {
    id: string;
    data: {
      current: {
        type: string;
        listId?: string;
        position?: number;
      };
    };
  } | null;
}

// ===== 状态管理接口 =====
export interface KanbanFilterState {
  searchQuery: string;
  priority: PriorityLevel | 'all';
  completed: boolean | null;
}

export interface KanbanDragState {
  isDragging: boolean;
  draggedCard: Card | null;
  draggedList: List | null;
  dragOverListId: string | null;
}

// ===== API响应接口 =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error_code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ===== 错误处理接口 =====
export interface KanbanError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ===== 工具类型 =====
export type CardSortField = 'title' | 'due_date' | 'priority' | 'created_at' | 'updated_at';
export type CardSortOrder = 'asc' | 'desc';

export interface CardSortOptions {
  field: CardSortField;
  order: CardSortOrder;
}

export interface KanbanViewOptions {
  showCompleted: boolean;
  groupByPriority: boolean;
  compactMode: boolean;
  showTags: boolean;
  sortOptions: CardSortOptions;
}

// ===== 扩展类型 =====
export interface CardWithList extends Card {
  list_name?: string;
  board_name?: string;
}

export interface ListWithStats extends List {
  total_cards: number;
  completed_cards: number;
  overdue_cards: number;
}

export interface BoardWithStats extends Board {
  stats: BoardStats;
  lists_with_stats: ListWithStats[];
}

// ===== 表单接口 =====
export interface BoardFormData {
  name: string;
  description: string;
  background_color: string;
  background_image?: string;
}

export interface CardFormData {
  title: string;
  description: string;
  due_date?: string;
  priority: PriorityLevel;
  color?: string;
  tags: string[];
}

export interface ListFormData {
  name: string;
  description: string;
}

// ===== 事件处理接口 =====
export interface CardEventHandlers {
  onCardCreate: (listId: string, cardData: CardCreate) => void;
  onCardUpdate: (cardId: string, cardData: CardUpdate) => void;
  onCardDelete: (cardId: string) => void;
  onCardMove: (cardId: string, targetListId: string, newPosition: number) => void;
  onCardClick: (card: Card) => void;
}

export interface ListEventHandlers {
  onListCreate: (boardId: string, listData: ListCreate) => void;
  onListUpdate: (listId: string, listData: ListUpdate) => void;
  onListDelete: (listId: string) => void;
  onListReorder: (boardId: string, listIds: string[]) => void;
}

export interface BoardEventHandlers {
  onBoardCreate: (boardData: BoardCreate) => void;
  onBoardUpdate: (boardId: string, boardData: BoardUpdate) => void;
  onBoardDelete: (boardId: string) => void;
  onBoardSelect: (boardId: string) => void;
}