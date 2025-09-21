/**
 * AI对话状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModel, Conversation, Message, ChatSession, AISettings } from '@/types/ai';

interface AIState {
  // 模型配置
  models: AIModel[];
  settings: AISettings;

  // 对话状态
  conversations: Conversation[];
  currentConversationId: string | null;
  chatSessions: Map<string, ChatSession>;

  // 加载状态
  isLoading: boolean;
  error: string | null;
}

interface AIActions {
  // 模型管理
  setModels: (models: AIModel[]) => void;
  updateSettings: (settings: Partial<AISettings>) => void;
  setApiKey: (provider: string, key: string) => void;

  // 对话管理
  createConversation: (title?: string, model?: string) => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;

  // 消息管理
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  streamMessage: (conversationId: string, messageId: string, content: string) => void;

  // 会话管理
  createChatSession: (conversationId: string) => string;
  updateChatSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteChatSession: (sessionId: string) => void;

  // 错误处理
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // 工具方法
  getCurrentConversation: () => Conversation | null;
  getCurrentModel: () => AIModel | null;
  getConversationHistory: (limit?: number) => Conversation[];
}

export const useAIStore = create<AIState & AIActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      models: [
        {
          id: 'kimi-moonshot-v1-8k',
          name: 'Kimi Moonshot v1 (8K)',
          provider: 'kimi',
          maxTokens: 8000,
          description: 'Moonshot AI 的 Kimi 模型，支持长文本处理',
          isAvailable: true
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openai',
          maxTokens: 4096,
          description: 'OpenAI GPT-3.5 Turbo 模型',
          isAvailable: true
        }
      ],

      settings: {
        defaultModel: 'kimi-moonshot-v1-8k',
        apiKeys: {},
        maxHistoryLength: 50,
        enableStreaming: true,
        temperature: 0.7
      },

      conversations: [],
      currentConversationId: null,
      chatSessions: new Map(),
      isLoading: false,
      error: null,

      // 模型管理
      setModels: (models) => set({ models }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      setApiKey: (provider, key) => set((state) => ({
        settings: {
          ...state.settings,
          apiKeys: {
            ...state.settings.apiKeys,
            [provider]: key
          }
        }
      })),

      // 对话管理
      createConversation: (title, model) => {
        const conversation: Conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: title || '新对话',
          messages: [],
          model: model || get().settings.defaultModel,
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: conversation.id
        }));

        return conversation;
      },

      selectConversation: (id) => set({ currentConversationId: id }),

      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== id),
        currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
      })),

      archiveConversation: (id) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, isArchived: true } : conv
        )
      })),

      updateConversationTitle: (id, title) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
        )
      })),

      // 消息管理
      addMessage: (conversationId, messageData) => set((state) => {
        const message: Message = {
          ...messageData,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        return {
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date()
                }
              : conv
          )
        };
      }),

      updateMessage: (conversationId, messageId, updates) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              }
            : conv
        )
      })),

      streamMessage: (conversationId, messageId, content) => set((state) => {
        const conversation = state.conversations.find(conv => conv.id === conversationId);
        if (!conversation) return state;

        const message = conversation.messages.find(msg => msg.id === messageId);
        if (!message) return state;

        return {
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + content }
                      : msg
                  )
                }
              : conv
          )
        };
      }),

      // 会话管理
      createChatSession: (conversationId) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session: ChatSession = {
          id: sessionId,
          conversationId,
          status: 'idle'
        };

        set((state) => ({
          chatSessions: new Map(state.chatSessions).set(sessionId, session)
        }));

        return sessionId;
      },

      updateChatSession: (sessionId, updates) => set((state) => {
        const session = state.chatSessions.get(sessionId);
        if (!session) return state;

        return {
          chatSessions: new Map(state.chatSessions).set(sessionId, {
            ...session,
            ...updates
          })
        };
      }),

      deleteChatSession: (sessionId) => set((state) => {
        const newSessions = new Map(state.chatSessions);
        newSessions.delete(sessionId);
        return { chatSessions: newSessions };
      }),

      // 错误处理
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      // 工具方法
      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find(conv => conv.id === state.currentConversationId) || null;
      },

      getCurrentModel: () => {
        const state = get();
        const conversation = state.conversations.find(conv => conv.id === state.currentConversationId);
        if (!conversation) return state.models.find(m => m.id === state.settings.defaultModel) || null;
        return state.models.find(m => m.id === conversation.model) || null;
      },

      getConversationHistory: (limit) => {
        const state = get();
        const conversations = state.conversations.filter(conv => !conv.isArchived);
        return limit ? conversations.slice(0, limit) : conversations;
      }
    }),
    {
      name: 'ai-workbench-store',
      partialize: (state) => ({
        // 只持久化配置和历史记录，不持久化临时状态
        models: state.models,
        settings: state.settings,
        conversations: state.conversations,
        currentConversationId: state.currentConversationId
      })
    }
  )
);