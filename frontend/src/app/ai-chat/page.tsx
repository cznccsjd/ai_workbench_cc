/**
 * AI对话页面
 */

import { Metadata } from 'next';
import ChatInterface from '@/components/ai-chat/ChatInterface';

export const metadata: Metadata = {
  title: 'AI对话 - AI工作台',
  description: '与AI助手进行智能对话',
};

export default function AIChatPage() {
  return (
    <div className="h-screen bg-gray-50">
      <ChatInterface />
    </div>
  );
}