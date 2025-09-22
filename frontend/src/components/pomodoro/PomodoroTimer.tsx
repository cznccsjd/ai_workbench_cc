/**
 * Enhanced Pomodoro Timer Component with Backend Integration
 * Integrates with the backend-synced pomodoro store
 */

'use client'

import React, { useEffect, useCallback } from 'react'
import usePomodoroStore from '@/stores/pomodoroStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Settings, Play, Pause, RotateCcw, SkipForward, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Utility function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const PomodoroTimer: React.FC = () => {
  const {
    // Timer state
    timerState,
    currentSessionType,
    timeRemaining,
    totalDuration,
    sessionCount,
    currentSessionId,

    // Backend data
    settings,
    statistics,

    // UI state
    isLoading,
    error,
    isInitializing,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeTimer,
    updateSettings,
    fetchStatistics,
    setError,
    clearError,
  } = usePomodoroStore()

  // Initialize component and fetch statistics
  useEffect(() => {
    if (!isInitializing && statistics === null) {
      fetchStatistics()
    }
  }, [isInitializing, statistics, fetchStatistics])

  // Handle errors
  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Request notification permission
  useEffect(() => {
    if (settings.sound_enabled && 'Notification' in window) {
      Notification.requestPermission().catch(() => {
        // Ignore permission errors
      })
    }
  }, [settings.sound_enabled])

  // Handle notification and sound when timer completes
  useEffect(() => {
    if (timeRemaining === 0 && timerState === 'completed') {
      // Play sound if enabled
      if (settings.sound_enabled) {
        const audio = new Audio('/sounds/notification.mp3')
        audio.play().catch(() => {
          // Ignore audio errors (user might have blocked autoplay)
        })
      }

      // Show notification if enabled
      if (settings.sound_enabled && 'Notification' in window && Notification.permission === 'granted') {
        const isWorking = currentSessionType === 'work'
        const title = isWorking ? '休息时间到了！' : '开始专注工作！'
        const body = isWorking
          ? `完成了 ${settings.work_duration} 分钟的专注时间，休息一下吧！`
          : '休息结束，继续加油！'

        new Notification(title, {
          body,
          icon: '/favicon.ico',
        })
      }
    }
  }, [timeRemaining, timerState, currentSessionType, settings.sound_enabled, settings.work_duration])

  // Get state label for UI
  const getStateLabel = useCallback(() => {
    switch (timerState) {
      case 'running':
        return currentSessionType === 'work' ? '专注中' : '休息中'
      case 'paused':
        return '已暂停'
      case 'completed':
        return '已完成'
      default:
        return currentSessionType === 'work' ? '准备专注' : '准备休息'
    }
  }, [timerState, currentSessionType])

  // Calculate progress percentage
  const getProgress = useCallback(() => {
    if (totalDuration === 0) return 0
    return ((totalDuration - timeRemaining) / totalDuration) * 100
  }, [timeRemaining, totalDuration])

  // Get background gradient class
  const getBackgroundClass = useCallback(() => {
    if (currentSessionType === 'work') {
      return 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
    } else {
      return 'from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20'
    }
  }, [currentSessionType])

  // Handle timer control actions
  const handleStart = useCallback(async () => {
    try {
      await startTimer()
    } catch (error) {
      console.error('Failed to start timer:', error)
      setError('无法开始计时器')
    }
  }, [startTimer, setError])

  const handlePause = useCallback(() => {
    pauseTimer()
  }, [pauseTimer])

  const handleResume = useCallback(() => {
    resumeTimer()
  }, [resumeTimer])

  const handleStop = useCallback(async () => {
    try {
      await stopTimer()
    } catch (error) {
      console.error('Failed to stop timer:', error)
      setError('无法停止计时器')
    }
  }, [stopTimer, setError])

  const handleSkip = useCallback(async () => {
    try {
      await completeTimer()
    } catch (error) {
      console.error('Failed to skip session:', error)
      setError('无法跳过当前时段')
    }
  }, [completeTimer, setError])

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在初始化番茄钟...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br transition-all duration-1000",
      getBackgroundClass()
    )}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            番茄钟
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            专注工作，高效休息
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Timer Card */}
        <Card className="mx-auto max-w-md p-8 text-center relative overflow-hidden">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}

          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                className={cn(
                  "transition-all duration-1000",
                  currentSessionType === 'work' ? "text-red-500" : "text-green-500"
                )}
              />
            </svg>

            {/* Timer Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getStateLabel()}
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              第 {sessionCount + 1} 个番茄钟
            </div>
            <div className="flex justify-center mt-2 space-x-1">
              {Array.from({ length: settings.long_break_interval }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i < (sessionCount % settings.long_break_interval)
                      ? "bg-red-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-3">
            {timerState === 'running' ? (
              <Button
                onClick={handlePause}
                size="lg"
                className="px-6 bg-yellow-500 hover:bg-yellow-600"
                disabled={isLoading}
              >
                <Pause className="w-5 h-5 mr-2" />
                暂停
              </Button>
            ) : timerState === 'paused' ? (
              <Button
                onClick={handleResume}
                size="lg"
                className="px-6 bg-green-500 hover:bg-green-600"
                disabled={isLoading}
              >
                <Play className="w-5 h-5 mr-2" />
                继续
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                size="lg"
                className="px-6 bg-green-500 hover:bg-green-600"
                disabled={isLoading}
              >
                <Play className="w-5 h-5 mr-2" />
                开始
              </Button>
            )}

            <Button
              onClick={handleStop}
              variant="outline"
              size="lg"
              className="px-4"
              disabled={isLoading}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            {timerState === 'running' && (
              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="px-4"
                disabled={isLoading}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            )}
          </div>
        </Card>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.total_sessions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                总番茄钟
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor(statistics.total_focus_time / 60)}h {statistics.total_focus_time % 60}m
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                总专注时间
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {statistics.streak_days}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                连续天数
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default PomodoroTimer