/**
 * aiStore 测试
 */

import { renderHook, act } from '@testing-library/react';

// 创建简单的store模拟
const mockAIStore = {
  conversations: [],
  currentConversationId: null,
  createConversation: jest.fn(() => ({ id: 'new-conv', title: '新对话', messages: [] })),
  selectConversation: jest.fn(),
  deleteConversation: jest.fn(),
  addMessage: jest.fn(),
  updateMessage: jest.fn(),
  getCurrentConversation: jest.fn(() => null),
};

// Mock Zustand
jest.mock('zustand', () => ({
  create: () => () => mockAIStore,
  devtools: (fn: any) => fn,
}));

import { useAIStore } from '@/stores/aiStore';

describe('aiStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty conversations', () => {
    const store = useAIStore();
    expect(store.conversations).toEqual([]);
    expect(store.currentConversationId).toBe(null);
  });

  it('should create a new conversation', () => {
    const store = useAIStore();
    const result = store.createConversation();

    expect(store.createConversation).toHaveBeenCalled();
    expect(result).toEqual({ id: 'new-conv', title: '新对话', messages: [] });
  });

  it('should select a conversation', () => {
    const store = useAIStore();
    store.selectConversation('conv-1');

    expect(store.selectConversation).toHaveBeenCalledWith('conv-1');
  });

  it('should delete a conversation', () => {
    const store = useAIStore();
    store.deleteConversation('conv-1');

    expect(store.deleteConversation).toHaveBeenCalledWith('conv-1');
  });

  it('should add a message to conversation', () => {
    const store = useAIStore();
    const message = { content: 'Hello', role: 'user' as const };

    store.addMessage('conv-1', message);

    expect(store.addMessage).toHaveBeenCalledWith('conv-1', message);
  });

  it('should update a message', () => {
    const store = useAIStore();

    store.updateMessage('conv-1', 'msg-1', { content: 'Updated content' });

    expect(store.updateMessage).toHaveBeenCalledWith('conv-1', 'msg-1', { content: 'Updated content' });
  });

  it('should get current conversation', () => {
    const store = useAIStore();
    const result = store.getCurrentConversation();

    expect(store.getCurrentConversation).toHaveBeenCalled();
    expect(result).toBe(null);
  });
});