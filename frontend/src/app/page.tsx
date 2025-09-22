/**
 * AI工作台主页面
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI工作台
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            智能化的工作效率提升工具，集成AI记事本、对话、番茄钟和项目管理功能
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <Link href="/ai-notepad" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI记事本
              </h3>
              <p className="text-gray-600">
                智能整理笔记，自动提取待办事项
              </p>
            </div>
          </Link>

          <Link href="/ai-chat" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI对话
              </h3>
              <p className="text-gray-600">
                与AI助手进行智能对话，支持多模型
              </p>
            </div>
          </Link>

          <Link href="/pomodoro" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">🍅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                番茄钟
              </h3>
              <p className="text-gray-600">
                专注工作25分钟，科学时间管理
              </p>
            </div>
          </Link>

          <Link href="/boards" className="group">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                项目管理
              </h3>
              <p className="text-gray-600">
                Trello风格看板，高效项目协作
              </p>
            </div>
          </Link>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600">
            选择一个功能开始体验AI工作台
          </p>
        </div>
      </div>
    </div>
  );
}