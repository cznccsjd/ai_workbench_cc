/**
 * 记事本相关类型定义
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  isBookmarked: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  readingTime: number;
}

export interface TodoItem {
  id: string;
  content: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  noteId: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface NoteFilters {
  searchQuery: string;
  tags: string[];
  isBookmarked?: boolean;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface NoteState {
  notes: Note[];
  selectedNoteId: string | null;
  todos: TodoItem[];
  filters: NoteFilters;
  isLoading: boolean;
  error: string | null;
  aiProcessing: boolean;
  aiError: string | null;
}

export interface CreateNoteData {
  title: string;
  content?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  isBookmarked?: boolean;
  tags?: string[];
}

export interface OrganizedContent {
  title: string;
  content: string;
  tags: string[];
  summary: string;
}

export interface TodoExtractionResult {
  todos: TodoItem[];
  summary: string;
}