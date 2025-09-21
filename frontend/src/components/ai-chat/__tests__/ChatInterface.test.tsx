/**
 * ChatInterface 组件测试
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { useAIStore } from '@/stores/aiStore';

// Mock the store
jest.mock('@/stores/aiStore');

// Mock the streaming hook
jest.mock('@/hooks/useAIStream', () => ({
  useSimpleAIStream: () => ({
    streamingContent: '',
    isStreaming: false,
    streamMessage: jest.fn(),
    stopStreaming: jest.fn(),
    error: null,
  }),
}));

describe('ChatInterface', () => {
  const mockStore = {
    conversations: [],
    currentConversationId: null,
    createConversation: jest.fn(),
    selectConversation: jest.fn(),
    deleteConversation: jest.fn(),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
    getCurrentConversation: jest.fn(() => null),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAIStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders without crashing', () => {
    render(<ChatInterface />);
    expect(screen.getByText('对话历史')).toBeInTheDocument();
  });

  it('creates a new conversation when there are no conversations', () => {
    render(<ChatInterface />);

    expect(mockStore.createConversation).toHaveBeenCalled();
  });

  it('displays welcome message when no conversation is selected', () => {
    render(<ChatInterface />);

    expect(screen.getByText('开始与AI对话')).toBeInTheDocument();
    expect(screen.getByText('输入你的问题或想法，我会尽力帮助你')).toBeInTheDocument();
  });

  it('displays conversation when one exists', () => {
    const mockConversation = {
      id: 'test-conv',
      title: 'Test Conversation',
      messages: [
        {
          id: 'msg1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
          status: 'sent' as const,
        },
        {
          id: 'msg2',
          role: 'assistant' as const,
          content: 'Hi there!',
          timestamp: new Date(),
          status: 'sent' as const,
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

  it('handles message sending', async () => {
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

    const { useSimpleAIStream } = require('@/hooks/useAIStream');
    const mockStreamMessage = jest.fn();
    useSimpleAIStream.mockReturnValue({
      streamingContent: '',
      isStreaming: false,
      streamMessage: mockStreamMessage,
      stopStreaming: jest.fn(),
      error: null,
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('输入消息... (Shift+Enter 换行)');
    const sendButton = screen.getByTitle('发送消息');

    await userEvent.type(input, 'Test message');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockStore.addMessage).toHaveBeenCalledWith(
        'test-conv',
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
          status: 'sent',
        })
      );
    });

    expect(mockStreamMessage).toHaveBeenCalledWith('Test message', expect.any(Object));
  });

  it('handles new conversation creation', () => {
    render(<ChatInterface />);

    const newConversationButton = screen.getByTitle('新建对话');
    fireEvent.click(newConversationButton);

    expect(mockStore.createConversation).toHaveBeenCalled();
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
    fireEvent.click(sendButton);

    expect(mockStore.addMessage).not.toHaveBeenCalled();
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

    const { useSimpleAIStream } = require('@/hooks/useAIStream');
    useSimpleAIStream.mockReturnValue({
      streamingContent: '',
      isStreaming: true,
      streamMessage: jest.fn(),
      stopStreaming: jest.fn(),
      error: null,
    });

    render(<ChatInterface />);

    const sendButton = screen.getByTitle('发送消息');
    expect(sendButton).toBeDisabled();
  });
});