/**
 * 消息列表组件
 */

'use client';

import { useRef, useEffect } from 'react';
import { Message } from '@/types/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

export default function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 复制消息内容
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 可以添加toast提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-lg mb-2">开始与AI对话</p>
          <p className="text-sm">输入你的问题或想法，我会尽力帮助你</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={messagesContainerRef} className="space-y-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
            {/* 消息气泡 */}
            <div
              className={`relative px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.status === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {/* 消息内容 */}
              <div className="prose prose-sm max-w-none">
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 自定义渲染组件
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code
                            className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic">
                            {children}
                          </blockquote>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>

              {/* 消息状态指示器 */}
              {message.status === 'sending' && (
                <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
                  发送中...
                </div>
              )}
              {message.status === 'error' && (
                <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                  发送失败
                </div>
              )}
            </div>

            {/* 消息元信息 */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span>{formatTime(message.timestamp)}</span>
                {message.model && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                    {message.model}
                  </span>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <button
                  onClick={() => copyMessage(message.content)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="复制消息"
                >
                  📋
                </button>
                {message.role === 'assistant' && index === messages.length - 1 && (
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="重新生成"
                  >
                    🔄
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 正在输入指示器 */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">AI正在输入...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}