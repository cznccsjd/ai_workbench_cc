/**
 * Enhanced Pomodoro Settings Component with Backend Integration
 * Integrates with the backend-synced pomodoro store
 */

'use client'

import React, { useState, useCallback } from 'react'
import usePomodoroStore from '@/stores/pomodoroStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Settings, Save, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const PomodoroSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
    error,
    clearError,
  } = usePomodoroStore()

  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Handle setting changes locally
  const handleSettingChange = useCallback((key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }, [])

  // Save settings to backend
  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true)
    clearError()

    try {
      await updateSettings(localSettings)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
      // Revert to current backend settings on error
      setLocalSettings(settings)
    } finally {
      setIsSaving(false)
    }
  }, [localSettings, updateSettings, settings, clearError])

  // Reset settings to defaults
  const handleResetSettings = useCallback(async () => {
    setIsSaving(true)
    clearError()

    try {
      await resetSettings()
      setLocalSettings(settings)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    } finally {
      setIsSaving(false)
    }
  }, [resetSettings, settings, clearError])

  // Update local settings when backend settings change
  React.useEffect(() => {
    setLocalSettings(settings)
    setHasChanges(false)
  }, [settings])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-xl font-semibold">番茄钟设置</h2>
        </div>

        {hasChanges && (
          <Button
            onClick={handleSaveSettings}
            size="sm"
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存设置
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Time Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">时间设置</h3>
        <div className="space-y-6">
          <div>
            <Label htmlFor="work-duration">专注时间 (分钟)</Label>
            <div className="flex items-center space-x-3 mt-2">
              <Slider
                id="work-duration"
                min={15}
                max={60}
                step={1}
                value={[localSettings.work_duration]}
                onValueChange={([value]) => handleSettingChange('work_duration', value)}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-sm font-medium w-12 text-right">
                {localSettings.work_duration}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              建议: 25-30分钟为最佳专注时长
            </p>
          </div>

          <div>
            <Label htmlFor="short-break-duration">短休息 (分钟)</Label>
            <div className="flex items-center space-x-3 mt-2">
              <Slider
                id="short-break-duration"
                min={1}
                max={15}
                step={1}
                value={[localSettings.short_break_duration]}
                onValueChange={([value]) => handleSettingChange('short_break_duration', value)}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-sm font-medium w-12 text-right">
                {localSettings.short_break_duration}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              建议: 5分钟短休息可以让大脑放松
            </p>
          </div>

          <div>
            <Label htmlFor="long-break-duration">长休息 (分钟)</Label>
            <div className="flex items-center space-x-3 mt-2">
              <Slider
                id="long-break-duration"
                min={10}
                max={45}
                step={1}
                value={[localSettings.long_break_duration]}
                onValueChange={([value]) => handleSettingChange('long_break_duration', value)}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-sm font-medium w-12 text-right">
                {localSettings.long_break_duration}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              建议: 15-30分钟长休息可以充分恢复精力
            </p>
          </div>

          <div>
            <Label htmlFor="long-break-interval">长休息间隔 (个)</Label>
            <div className="flex items-center space-x-3 mt-2">
              <Slider
                id="long-break-interval"
                min={2}
                max={8}
                step={1}
                value={[localSettings.long_break_interval]}
                onValueChange={([value]) => handleSettingChange('long_break_interval', value)}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-sm font-medium w-12 text-right">
                {localSettings.long_break_interval}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              每完成多少个番茄钟后进入长休息
            </p>
          </div>
        </div>
      </Card>

      {/* Auto Start Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">自动开始</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-start-breaks">专注结束后自动开始休息</Label>
              <p className="text-xs text-gray-500">
                完成专注时段后自动开始休息计时
              </p>
            </div>
            <Switch
              id="auto-start-breaks"
              checked={localSettings.auto_start_breaks}
              onCheckedChange={(checked) => handleSettingChange('auto_start_breaks', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-start-work">休息结束后自动开始专注</Label>
              <p className="text-xs text-gray-500">
                完成休息时段后自动开始专注计时
              </p>
            </div>
            <Switch
              id="auto-start-work"
              checked={localSettings.auto_start_work}
              onCheckedChange={(checked) => handleSettingChange('auto_start_work', checked)}
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">通知设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound-enabled">声音提醒</Label>
              <p className="text-xs text-gray-500">
                计时结束时播放提示音
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={localSettings.sound_enabled}
              onCheckedChange={(checked) => handleSettingChange('sound_enabled', checked)}
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={handleResetSettings}
          variant="outline"
          disabled={isSaving || isLoading}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置为默认
        </Button>

        {hasChanges && (
          <Button
            onClick={() => {
              setLocalSettings(settings)
              setHasChanges(false)
              clearError()
            }}
            variant="outline"
            disabled={isSaving || isLoading}
          >
            取消更改
          </Button>
        )}
      </div>
    </div>
  )
}

export default PomodoroSettings