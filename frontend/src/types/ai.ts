/**
 * AI对话相关类型定义
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'kimi' | 'openai' | 'anthropic';
  maxTokens: number;
  description: string;
  isAvailable: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  status?: 'sending' | 'sent' | 'error' | 'streaming';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
}

export interface ChatSession {
  id: string;
  conversationId: string;
  status: 'idle' | 'loading' | 'streaming' | 'error';
  error?: string;
}

export interface AISettings {
  defaultModel: string;
  apiKeys: {
    kimi?: string;
    openai?: string;
    anthropic?: string;
  };
  maxHistoryLength: number;
  enableStreaming: boolean;
  temperature: number;
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}