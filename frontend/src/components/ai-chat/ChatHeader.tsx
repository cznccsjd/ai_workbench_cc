/**
 * 对话头部组件
 */

'use client';

import { useState } from 'react';
import { Conversation } from '@/types/ai';
import { ChevronDownIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onNewConversation: () => void;
}

export default function ChatHeader({ conversation, onNewConversation }: ChatHeaderProps) {
  const [showModelMenu, setShowModelMenu] = useState(false);

  const handleModelSelect = (modelId: string) => {
    // 更新当前对话的模型
    setShowModelMenu(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {conversation?.title || 'AI对话'}
          </h1>

          {conversation && (
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span>{conversation.model || '默认模型'}</span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showModelMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleModelSelect('kimi-moonshot-v1-8k')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Kimi Moonshot v1 (8K)
                    </button>
                    <button
                      onClick={() => handleModelSelect('gpt-3.5-turbo')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      GPT-3.5 Turbo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNewConversation}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>新对话</span>
          </button>

          <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}