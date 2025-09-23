/**
 * ChatInterface 组件测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { useAIStore } from '@/stores/aiStore';
import { useSimpleAIStream } from '@/hooks/useAIStream';

// Mock the store
jest.mock('@/stores/aiStore');

// Mock the streaming hook
jest.mock('@/hooks/useAIStream', () => ({
  useSimpleAIStream: jest.fn(),
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(() => true)
});

describe('ChatInterface', () => {
  const mockStore = {
    conversations: [],
    currentConversationId: null,
    createConversation: jest.fn(() => ({ id: 'mock-conversation-id', title: '新对话', messages: [] })),
    selectConversation: jest.fn(),
    deleteConversation: jest.fn(),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
    getCurrentConversation: jest.fn(() => null),
  };

  const mockStreamHook = {
    streamingContent: '',
    isStreaming: false,
    streamMessage: jest.fn(),
    stopStreaming: jest.fn(),
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAIStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (useSimpleAIStream as jest.Mock).mockReturnValue(mockStreamHook);
  });

  it('renders without crashing', () => {
    render(<ChatInterface />);
    expect(screen.getByText('对话历史')).toBeInTheDocument();
  });

  it('creates a new conversation when there are no conversations', () => {
    render(<ChatInterface />);

    expect(mockStore.createConversation).toHaveBeenCalled();
    expect(mockStore.selectConversation).toHaveBeenCalledWith('mock-conversation-id');
  });

  it('displays conversation when one exists', () => {
    const mockConversation = {
      id: 'test-conv',
      title: 'Test Conversation',
      messages: [
        {
          id: 'msg-1',
          content: 'Hello',
          role: 'user',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          content: 'Hi there!',
          role: 'assistant',
          timestamp: new Date(),
        },
      ],
      model: 'kimi-moonshot-v1-8k',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStore.getCurrentConversation.mockReturnValue(mockConversation);
    mockStore.currentConversationId = 'test-conv';

    render(<ChatInterface />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('handles new conversation creation', async () => {
    render(<ChatInterface />);

    const newConversationButton = screen.getByTitle('新建对话');
    fireEvent.click(newConversationButton);

    expect(mockStore.createConversation).toHaveBeenCalled();
    expect(mockStore.selectConversation).toHaveBeenCalledWith('mock-conversation-id');
  });

  it('prevents empty message sending', async () => {
    const mockConversation = {
      id: 'test-conv',
      title: 'Test Conversation',
      messages: [],
      model: 'kimi-moonshot-v1-8k',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStore.getCurrentConversation.mockReturnValue(mockConversation);
    mockStore.currentConversationId = 'test-conv';

    render(<ChatInterface />);

    const sendButton = screen.getByTitle('发送消息');

    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when streaming', () => {
    const mockConversation = {
      id: 'test-conv',
      title: 'Test Conversation',
      messages: [],
      model: 'kimi-moonshot-v1-8k',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStore.getCurrentConversation.mockReturnValue(mockConversation);
    mockStore.currentConversationId = 'test-conv';

    // Mock streaming state
    (useSimpleAIStream as jest.Mock).mockReturnValue({
      ...mockStreamHook,
      isStreaming: true,
    });

    render(<ChatInterface />);

    const sendButton = screen.getByTitle('发送消息');
    expect(sendButton).toBeDisabled();
  });

  it('displays conversation list in sidebar', () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: '对话1',
        messages: [],
        model: 'kimi-moonshot-v1-8k',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockStore.conversations = mockConversations;

    render(<ChatInterface />);

    expect(screen.getByText('对话1')).toBeInTheDocument();
  });

  it('handles conversation selection', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: '对话1',
        messages: [],
        model: 'kimi-moonshot-v1-8k',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockStore.conversations = mockConversations;

    render(<ChatInterface />);

    const conversationItem = screen.getByText('对话1');
    fireEvent.click(conversationItem);

    expect(mockStore.selectConversation).toHaveBeenCalledWith('conv-1');
  });

  it('basic functionality works correctly', () => {
    render(<ChatInterface />);

    // Verify core elements are present
    expect(screen.getByText('对话历史')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索对话...')).toBeInTheDocument();

    // Verify UI elements are accessible
    expect(screen.getByTitle('新建对话')).toBeInTheDocument();
  });
});