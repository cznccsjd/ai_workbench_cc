/**
 * Pomodoro Timer Component Tests
 * Tests for the enhanced PomodoroTimer component with backend integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PomodoroTimer from '../../../components/pomodoro/PomodoroTimer'
import usePomodoroStore from '../../../stores/pomodoroStore'

// Mock the store
jest.mock('../../../stores/pomodoroStore', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock UI components - use relative paths to avoid jest module mapping issues
jest.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}))

jest.mock('../../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('../../../components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: () => <span>SettingsIcon</span>,
  Play: () => <span>PlayIcon</span>,
  Pause: () => <span>PauseIcon</span>,
  RotateCcw: () => <span>ResetIcon</span>,
  SkipForward: () => <span>SkipIcon</span>,
  Loader2: () => <span>LoadingIcon</span>,
  AlertCircle: () => <span>AlertIcon</span>,
}))

// Mock window.Notification
const mockNotification = {
  requestPermission: jest.fn().mockResolvedValue('granted'),
  permission: 'granted',
}

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
})

describe('PomodoroTimer', () => {
  const mockStore = {
    // Timer state
    timerState: 'idle' as const,
    currentSessionType: 'work' as const,
    timeRemaining: 1500, // 25 minutes
    totalDuration: 1500,
    sessionCount: 0,
    currentSessionId: null,

    // Backend data
    settings: {
      work_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      long_break_interval: 4,
      auto_start_breaks: false,
      auto_start_work: false,
      sound_enabled: true,
    },
    statistics: {
      total_sessions: 42,
      total_focus_time: 1050,
      streak_days: 7,
    },

    // UI state
    isLoading: false,
    error: null,
    isInitializing: false,

    // Actions
    initializeStore: jest.fn(),
    startTimer: jest.fn(),
    pauseTimer: jest.fn(),
    resumeTimer: jest.fn(),
    stopTimer: jest.fn(),
    completeTimer: jest.fn(),
    updateSettings: jest.fn(),
    fetchStatistics: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue(mockStore)
  })

  it('renders without crashing', () => {
    render(<PomodoroTimer />)

    expect(screen.getByText('番茄钟')).toBeInTheDocument()
    expect(screen.getByText('专注工作，高效休息')).toBeInTheDocument()
  })

  it('displays the correct time format', () => {
    render(<PomodoroTimer />)

    // 25:00 format
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('shows loading state when initializing', () => {
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      isInitializing: true,
    })

    render(<PomodoroTimer />)

    expect(screen.getByText('正在初始化番茄钟...')).toBeInTheDocument()
    expect(screen.getByText('LoadingIcon')).toBeInTheDocument()
  })

  it('displays error message when there is an error', () => {
    const errorMessage = 'Failed to start timer'
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      error: errorMessage,
    })

    render(<PomodoroTimer />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText('AlertIcon')).toBeInTheDocument()
  })

  it('shows loading overlay when isLoading is true', () => {
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      isLoading: true,
    })

    render(<PomodoroTimer />)

    // Loading overlay should be present (checking for the loading icon in the overlay)
    expect(screen.getByText('LoadingIcon')).toBeInTheDocument()
  })

  describe('Timer Controls', () => {
    it('shows start button when timer is idle', () => {
      render(<PomodoroTimer />)

      expect(screen.getByText('PlayIcon')).toBeInTheDocument()
      expect(screen.getByText('开始')).toBeInTheDocument()
    })

    it('shows pause button when timer is running', () => {
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      render(<PomodoroTimer />)

      expect(screen.getByText('PauseIcon')).toBeInTheDocument()
      expect(screen.getByText('暂停')).toBeInTheDocument()
    })

    it('shows resume button when timer is paused', () => {
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'paused' as const,
      })

      render(<PomodoroTimer />)

      expect(screen.getByText('PlayIcon')).toBeInTheDocument()
      expect(screen.getByText('继续')).toBeInTheDocument()
    })

    it('calls startTimer when start button is clicked', async () => {
      const user = userEvent.setup()
      render(<PomodoroTimer />)

      const startButton = screen.getByText('开始')
      await user.click(startButton)

      expect(mockStore.startTimer).toHaveBeenCalledTimes(1)
    })

    it('calls pauseTimer when pause button is clicked', async () => {
      const user = userEvent.setup()
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      render(<PomodoroTimer />)

      const pauseButton = screen.getByText('暂停')
      await user.click(pauseButton)

      expect(mockStore.pauseTimer).toHaveBeenCalledTimes(1)
    })

    it('calls resumeTimer when resume button is clicked', async () => {
      const user = userEvent.setup()
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'paused' as const,
      })

      render(<PomodoroTimer />)

      const resumeButton = screen.getByText('继续')
      await user.click(resumeButton)

      expect(mockStore.resumeTimer).toHaveBeenCalledTimes(1)
    })

    it('calls stopTimer when stop button is clicked', async () => {
      const user = userEvent.setup()
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      render(<PomodoroTimer />)

      const stopButton = screen.getByText('ResetIcon')
      await user.click(stopButton)

      expect(mockStore.stopTimer).toHaveBeenCalledTimes(1)
    })

    it('calls completeTimer when skip button is clicked', async () => {
      const user = userEvent.setup()
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      render(<PomodoroTimer />)

      const skipButton = screen.getByText('SkipIcon')
      await user.click(skipButton)

      expect(mockStore.completeTimer).toHaveBeenCalledTimes(1)
    })
  })

  describe('Session Information', () => {
    it('displays session count and progress indicators', () => {
      render(<PomodoroTimer />)

      expect(screen.getByText('第 1 个番茄钟')).toBeInTheDocument()

      // Check for progress indicators (dots)
      const progressDots = screen.getAllByRole('generic').filter(element => {
        return element.classList.contains('w-2') && element.classList.contains('h-2')
      })

      // Should have 4 dots (long_break_interval is 4)
      expect(progressDots).toHaveLength(4)
    })

    it('shows correct session type label', () => {
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        currentSessionType: 'short_break' as const,
      })

      render(<PomodoroTimer />)

      expect(screen.getByText('准备休息')).toBeInTheDocument()
    })

    it('shows correct timer state labels', () => {
      const states = [
        { state: 'idle' as const, label: '准备专注' },
        { state: 'running' as const, label: '专注中' },
        { state: 'paused' as const, label: '已暂停' },
        { state: 'completed' as const, label: '已完成' },
      ]

      states.forEach(({ state, label }) => {
        ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
          ...mockStore,
          timerState: state,
        })

        const { unmount } = render(<PomodoroTimer />)
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Statistics Display', () => {
    it('displays statistics when available', () => {
      render(<PomodoroTimer />)

      expect(screen.getByText('42')).toBeInTheDocument() // total_sessions
      expect(screen.getByText('总番茄钟')).toBeInTheDocument()

      expect(screen.getByText('17h 30m')).toBeInTheDocument() // total_focus_time
      expect(screen.getByText('总专注时间')).toBeInTheDocument()

      expect(screen.getByText('7')).toBeInTheDocument() // streak_days
      expect(screen.getByText('连续天数')).toBeInTheDocument()
    })

    it('does not display statistics when not available', () => {
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        statistics: null,
      })

      render(<PomodoroTimer />)

      expect(screen.queryByText('总番茄钟')).not.toBeInTheDocument()
      expect(screen.queryByText('总专注时间')).not.toBeInTheDocument()
      expect(screen.queryByText('连续天数')).not.toBeInTheDocument()
    })
  })

  describe('Background Styling', () => {
    it('applies work session background gradient', () => {
      const { container } = render(<PomodoroTimer />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('from-red-50', 'to-orange-50')
    })

    it('applies break session background gradient', () => {
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        currentSessionType: 'short_break' as const,
      })

      const { container } = render(<PomodoroTimer />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('from-green-50', 'to-blue-50')
    })
  })

  describe('Notification and Sound', () => {
    it('requests notification permission when sound is enabled', () => {
      render(<PomodoroTimer />)

      expect(mockNotification.requestPermission).toHaveBeenCalled()
    })

    it('does not request notification permission when sound is disabled', () => {
      mockNotification.requestPermission.mockClear()

      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        settings: { ...mockStore.settings, sound_enabled: false },
      })

      render(<PomodoroTimer />)

      expect(mockNotification.requestPermission).not.toHaveBeenCalled()
    })

    it('shows notification when timer completes', () => {
      const mockNotificationInstance = {
        close: jest.fn(),
      }

      global.Notification = jest.fn().mockImplementation(() => mockNotificationInstance) as any

      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timeRemaining: 0,
        timerState: 'completed' as const,
      })

      render(<PomodoroTimer />)

      expect(global.Notification).toHaveBeenCalledWith('休息时间到了！', {
        body: '完成了 25 分钟的专注时间，休息一下吧！',
        icon: '/favicon.ico',
      })
    })
  })

  describe('Error Handling in Actions', () => {
    it('handles startTimer errors gracefully', async () => {
      const user = userEvent.setup()
      mockStore.startTimer.mockRejectedValueOnce(new Error('Network error'))

      render(<PomodoroTimer />)

      const startButton = screen.getByText('开始')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('无法开始计时器')
      })
    })

    it('handles stopTimer errors gracefully', async () => {
      const user = userEvent.setup()
      mockStore.stopTimer.mockRejectedValueOnce(new Error('Network error'))

      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      render(<PomodoroTimer />)

      const stopButton = screen.getByText('ResetIcon')
      await user.click(stopButton)

      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('无法停止计时器')
      })
    })

    it('handles completeTimer errors gracefully', async () => {
      const user = userEvent.setup()
      mockStore.completeTimer.mockRejectedValueOnce(new Error('Network error'))

      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      render(<PomodoroTimer />)

      const skipButton = screen.getByText('SkipIcon')
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockStore.setError).toHaveBeenCalledWith('无法跳过当前时段')
      })
    })
  })

  describe('Button States', () => {
    it('disables buttons when loading', () => {
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        isLoading: true,
      })

      render(<PomodoroTimer />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('shows skip button only when timer is running', () => {
      const { rerender } = render(<PomodoroTimer />)

      // Initially idle - no skip button
      expect(screen.queryByText('SkipIcon')).not.toBeInTheDocument()

      // Switch to running
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        timerState: 'running' as const,
      })

      rerender(<PomodoroTimer />)

      // Now skip button should be visible
      expect(screen.getByText('SkipIcon')).toBeInTheDocument()
    })
  })
})