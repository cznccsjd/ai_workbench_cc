/**
 * 聊天输入组件
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSendMessage, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 发送消息
  const handleSend = async () => {
    if (!message.trim() || disabled) return;

    try {
      await onSendMessage(message.trim());
      setMessage('');

      // 重新聚焦输入框
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 防止在中文输入过程中触发发送
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理中文输入
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 自动调整文本框高度
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // 自动调整高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            disabled={disabled}
            placeholder={placeholder || "输入消息... (Shift+Enter 换行)"}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '52px', maxHeight: '120px' }}
          />

          {/* 输入提示 */}
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {isComposing ? '中文输入中...' : 'Enter 发送'}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="发送消息"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 输入统计 */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div>
          {message.length > 0 && (
            <span>{message.length} 字符</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>Shift+Enter 换行</span>
          <span>Enter 发送</span>
        </div>
      </div>
    </div>
  );
}