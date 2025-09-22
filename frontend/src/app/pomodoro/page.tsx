'use client'

import React, { useState } from 'react'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer'
import PomodoroSettings from '@/components/pomodoro/PomodoroSettings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Settings, Timer } from 'lucide-react'

const PomodoroPage: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Timer className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              番茄钟
            </h1>
          </div>

          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>{showSettings ? '隐藏设置' : '显示设置'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer */}
          <div className="lg:col-span-2">
            <PomodoroTimer />
          </div>

          {/* Settings Panel */}
          <div className="lg:col-span-1">
            {showSettings ? (
              <PomodoroSettings />
            ) : (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">使用说明</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>专注模式：</strong>25分钟专注工作，保持注意力集中
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>短休息：</strong>5分钟放松时间，让大脑休息
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>长休息：</strong>15分钟深度休息，每4个番茄钟后
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p>点击右上角设置按钮可以自定义时间和通知选项。</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PomodoroPage