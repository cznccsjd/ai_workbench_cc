/**
 * AI对话主界面组件
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { Message } from '@/types/ai';
import { useSimpleAIStream } from '@/hooks/useAIStream';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';

export default function ChatInterface() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateMessage,
    getCurrentConversation
  } = useAIStore();

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversation = getCurrentConversation();
  const { streamingContent, isStreaming, streamMessage, stopStreaming, error } = useSimpleAIStream();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // 创建新对话
  const handleNewConversation = () => {
    const conversation = createConversation();
    selectConversation(conversation.id);
  };

  // 发送消息（支持流式响应）
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentConversationId) return;

    // 添加用户消息
    addMessage(currentConversationId, {
      role: 'user',
      content: content.trim(),
      status: 'sent'
    });

    setIsTyping(true);

    try {
      // 创建AI消息（用于流式更新）
      const aiMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: currentConversation?.model,
        status: 'streaming'
      };

      // 添加空的AI消息
      addMessage(currentConversationId, {
        role: 'assistant',
        content: '',
        model: currentConversation?.model,
        status: 'streaming'
      });

      // 开始流式响应
      await streamMessage(content.trim(), {
        onChunk: (chunk) => {
          // 实时更新AI消息内容
          const currentMessages = currentConversation?.messages || [];
          const aiMessageIndex = currentMessages.findIndex(msg => msg.status === 'streaming');

          if (aiMessageIndex !== -1) {
            const aiMessageId = currentMessages[aiMessageIndex].id;
            updateMessage(currentConversationId, aiMessageId, {
              content: currentMessages[aiMessageIndex].content + chunk
            });
          }
        },
        onComplete: (fullResponse) => {
          // 更新AI消息状态为完成
          const currentMessages = currentConversation?.messages || [];
          const aiMessageIndex = currentMessages.findIndex(msg => msg.status === 'streaming');

          if (aiMessageIndex !== -1) {
            const aiMessageId = currentMessages[aiMessageIndex].id;
            updateMessage(currentConversationId, aiMessageId, {
              content: fullResponse,
              status: 'sent'
            });
          }
          setIsTyping(false);
        },
        onError: (error) => {
          console.error('流式响应错误:', error);

          // 更新AI消息状态为错误
          const currentMessages = currentConversation?.messages || [];
          const aiMessageIndex = currentMessages.findIndex(msg => msg.status === 'streaming');

          if (aiMessageIndex !== -1) {
            const aiMessageId = currentMessages[aiMessageIndex].id;
            updateMessage(currentConversationId, aiMessageId, {
              content: '抱歉，我遇到了一些问题。请稍后重试。',
              status: 'error'
            });
          }
          setIsTyping(false);
        }
      });

    } catch (error) {
      console.error('发送消息失败:', error);

      // 添加错误消息
      addMessage(currentConversationId, {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后重试。',
        status: 'error'
      });
      setIsTyping(false);
    }
  };

  // 如果没有对话，创建一个新对话
  useEffect(() => {
    if (conversations.length === 0) {
      handleNewConversation();
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* 主对话区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <ChatHeader
          conversation={currentConversation}
          onNewConversation={handleNewConversation}
        />

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentConversation ? (
            <ChatMessages
              messages={currentConversation.messages}
              isTyping={isTyping}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg mb-2">开始与AI对话</p>
                <p className="text-sm">点击左侧的新建对话按钮开始</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        {currentConversation && (
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isTyping}
            placeholder="输入消息..."
          />
        )}
      </div>
    </div>
  );
}