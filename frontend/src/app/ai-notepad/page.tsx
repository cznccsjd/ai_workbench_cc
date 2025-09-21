/**
 * AI记事本页面
 * 集成AI记事本组件的完整页面
 */

import { Metadata } from 'next';
import { AiNotepad } from '@/components/ai-notepad';

export const metadata: Metadata = {
  title: 'AI记事本 - AI工作台',
  description: '智能的AI记事本，支持AI整理、Todo提取等功能',
};

export default function AiNotepadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">AI记事本</h1>
            <p className="text-gray-600 mt-1">智能的笔记管理工具，让AI帮您整理思路</p>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="h-screen">
        <AiNotepad />
      </div>

      {/* 功能说明 */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">智能写作</h3>
              <p className="text-gray-600">支持Markdown格式，实时预览，让写作更高效</p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI整理</h3>
              <p className="text-gray-600">一键整理笔记内容，优化结构，提升可读性</p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Todo提取</h3>
              <p className="text-gray-600">智能识别笔记中的任务，自动生成Todo清单</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">使用提示</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">🎯 快速开始</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>点击"新建笔记"创建您的第一个笔记</li>
                  <li>在编辑器中输入内容，支持Markdown语法</li>
                  <li>使用工具栏按钮快速格式化文本</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">🚀 AI功能</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>点击"整理"按钮让AI优化笔记结构</li>
                  <li>点击"提取Todo"自动生成任务清单</li>
                  <li>在右侧面板管理和完成Todo事项</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">🔍 搜索与筛选</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>在左侧面板搜索笔记标题和内容</li>
                  <li>使用标签筛选相关笔记</li>
                  <li>按创建时间或更新时间排序</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">⚡ 效率技巧</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>使用快捷键 **Ctrl+B** 加粗文本</li>
                  <li>拖拽分隔条调整面板宽度</li>
                  <li>自动保存功能确保内容不丢失</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}