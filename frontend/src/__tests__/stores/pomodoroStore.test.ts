/**
 * Pomodoro Store Tests
 * Tests for Zustand store with backend integration
 */

import { act, renderHook } from '@testing-library/react'
import usePomodoroStore from '../../stores/pomodoroStore'
import { pomodoroService } from '../../services/pomodoro'

// Mock the pomodoro service
jest.mock('../../services/pomodoro', () => ({
  pomodoroService: {
    getSettings: jest.fn(),
    getStatistics: jest.fn(),
    getRecentSessions: jest.fn(),
    getActiveSession: jest.fn(),
    createSession: jest.fn(),
    updateSession: jest.fn(),
    completeSession: jest.fn(),
    updateSettings: jest.fn(),
  }
}))

// Mock console methods to avoid test output pollution
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeEach(() => {
  console.log = jest.fn()
  console.error = jest.fn()
  jest.clearAllMocks()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

describe('PomodoroStore', () => {
  const mockSettings = {
    id: 'settings-123',
    user_id: 'user-456',
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    long_break_interval: 4,
    auto_start_breaks: false,
    auto_start_work: false,
    sound_enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockStatistics = {
    total_sessions: 42,
    completed_sessions: 38,
    total_focus_time: 1050,
    average_session_duration: 25,
    streak_days: 7,
    today_sessions: 3,
    today_focus_time: 75,
    weekly_stats: [
      { date: '2024-01-01', sessions: 5, focus_time: 125 },
      { date: '2024-01-02', sessions: 4, focus_time: 100 },
    ],
  }

  const mockSessions = [
    {
      id: 'session-123',
      user_id: 'user-456',
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T10:25:00Z',
      duration_minutes: 25,
      session_type: 'work' as const,
      completed: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:25:00Z',
    }
  ]

  const mockActiveSession = {
    id: 'session-active',
    user_id: 'user-456',
    start_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    end_time: null,
    duration_minutes: 25,
    session_type: 'work' as const,
    completed: false,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  }

  describe('initializeStore', () => {
    it('should initialize store with backend data', async () => {
      // Mock successful API calls
      ;(pomodoroService.getSettings as jest.Mock).mockResolvedValueOnce(mockSettings)
      ;(pomodoroService.getStatistics as jest.Mock).mockResolvedValueOnce(mockStatistics)
      ;(pomodoroService.getRecentSessions as jest.Mock).mockResolvedValueOnce(mockSessions)
      ;(pomodoroService.getActiveSession as jest.Mock).mockResolvedValueOnce(null)

      const { result } = renderHook(() => usePomodoroStore())

      await act(async () => {
        await result.current.initializeStore()
      })

      expect(result.current.settings).toEqual(mockSettings)
      expect(result.current.statistics).toEqual(mockStatistics)
      expect(result.current.sessions).toEqual(mockSessions)
      expect(result.current.isInitializing).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should restore active session state', async () => {
      // Mock successful API calls with active session
      ;(pomodoroService.getSettings as jest.Mock).mockResolvedValueOnce(mockSettings)
      ;(pomodoroService.getStatistics as jest.Mock).mockResolvedValueOnce(mockStatistics)
      ;(pomodoroService.getRecentSessions as jest.Mock).mockResolvedValueOnce(mockSessions)
      ;(pomodoroService.getActiveSession as jest.Mock).mockResolvedValueOnce(mockActiveSession)

      const { result } = renderHook(() => usePomodoroStore())

      await act(async () => {
        await result.current.initializeStore()
      })

      expect(result.current.currentSessionId).toBe('session-active')
      expect(result.current.currentSessionType).toBe('work')
      expect(result.current.timerState).toBe('running')
      expect(result.current.timeRemaining).toBeLessThan(25 * 60) // Less than full duration due to elapsed time
    })

    it('should handle API errors gracefully', async () => {
      // Mock API errors
      ;(pomodoroService.getSettings as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      ;(pomodoroService.getStatistics as jest.Mock).mockResolvedValueOnce(mockStatistics)
      ;(pomodoroService.getRecentSessions as jest.Mock).mockResolvedValueOnce(mockSessions)
      ;(pomodoroService.getActiveSession as jest.Mock).mockResolvedValueOnce(null)

      const { result } = renderHook(() => usePomodoroStore())

      await act(async () => {
        await result.current.initializeStore()
      })

      // Should use default settings on error
      expect(result.current.settings.work_duration).toBe(25)
      expect(result.current.isInitializing).toBe(false)
      expect(result.current.error).toBe('Failed to initialize pomodoro data')
    })
  })

  describe('Timer Actions', () => {
    beforeEach(() => {
      // Reset store state for each test
      const { result } = renderHook(() => usePomodoroStore())
      act(() => {
        result.current.setTimerState('idle')
        result.current.setError(null)
        result.current.isLoading = false
        result.current.timeRemaining = 25 * 60 // Reset to default work duration
        result.current.settings = mockSettings
        result.current.currentSessionId = null
      })
    })

    describe('startTimer', () => {
      it('should start a new timer session', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        // Mock successful session creation
        const newSession = { ...mockActiveSession, id: 'new-session' }
        ;(pomodoroService.createSession as jest.Mock).mockResolvedValueOnce(newSession)

        await act(async () => {
          await result.current.startTimer()
        })

        expect(pomodoroService.createSession).toHaveBeenCalled()
        expect(result.current.timerState).toBe('running')
        expect(result.current.currentSessionId).toBe('new-session')
        expect(result.current.isLoading).toBe(false)
      })

      it('should not start timer if already running', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('running')
        })

        await act(async () => {
          await result.current.startTimer()
        })

        expect(pomodoroService.createSession).not.toHaveBeenCalled()
      })

      it('should handle errors when starting timer', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        // Mock API error
        ;(pomodoroService.createSession as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

        await act(async () => {
          await result.current.startTimer()
        })

        expect(result.current.timerState).toBe('idle')
        expect(result.current.error).toBe('Failed to start pomodoro session')
        expect(result.current.isLoading).toBe(false)
      })
    })

    describe('pauseTimer', () => {
      it('should pause running timer', () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('running')
        })

        act(() => {
          result.current.pauseTimer()
        })

        expect(result.current.timerState).toBe('paused')
      })

      it('should not pause non-running timer', () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('idle')
        })

        act(() => {
          result.current.pauseTimer()
        })

        expect(result.current.timerState).toBe('idle')
      })
    })

    describe('resumeTimer', () => {
      it('should resume paused timer', () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('paused')
        })

        act(() => {
          result.current.resumeTimer()
        })

        expect(result.current.timerState).toBe('running')
      })

      it('should not resume non-paused timer', () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('idle')
        })

        act(() => {
          result.current.resumeTimer()
        })

        expect(result.current.timerState).toBe('idle')
      })
    })

    describe('stopTimer', () => {
      it('should stop timer and update session', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        // Set up running timer with session
        act(() => {
          result.current.setTimerState('running')
          result.current.currentSessionId = 'session-123'
        })

        // Mock successful session update
        ;(pomodoroService.updateSession as jest.Mock).mockResolvedValueOnce({
          id: 'session-123',
          completed: false,
        })

        await act(async () => {
          await result.current.stopTimer()
        })

        expect(pomodoroService.updateSession).toHaveBeenCalledWith('session-123', {
          end_time: expect.any(String),
          completed: false,
        })
        expect(result.current.timerState).toBe('idle')
        expect(result.current.currentSessionId).toBeNull()
        expect(result.current.isLoading).toBe(false)
      })

      it('should not stop idle timer', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('idle')
        })

        await act(async () => {
          await result.current.stopTimer()
        })

        expect(pomodoroService.updateSession).not.toHaveBeenCalled()
      })
    })

    describe('completeTimer', () => {
      it('should complete timer and transition to next session', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        // Set up running work session
        act(() => {
          result.current.setTimerState('running')
          result.current.currentSessionId = 'session-123'
          result.current.currentSessionType = 'work'
          result.current.sessionCount = 0
        })

        // Mock successful session completion
        ;(pomodoroService.completeSession as jest.Mock).mockResolvedValueOnce({
          id: 'session-123',
          completed: true,
        })

        await act(async () => {
          await result.current.completeTimer()
        })

        expect(pomodoroService.completeSession).toHaveBeenCalled()
        expect(result.current.timerState).toBe('completed')
        expect(result.current.sessionCount).toBe(1)
        expect(result.current.currentSessionId).toBeNull()
      })

      it('should handle errors when completing timer', async () => {
        const { result } = renderHook(() => usePomodoroStore())

        act(() => {
          result.current.setTimerState('running')
          result.current.currentSessionId = 'session-123'
        })

        // Mock API error
        ;(pomodoroService.completeSession as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

        await act(async () => {
          await result.current.completeTimer()
        })

        expect(result.current.error).toBe('Failed to complete pomodoro session')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('tick', () => {
    it('should decrement time remaining when timer is running', () => {
      const { result } = renderHook(() => usePomodoroStore())

      act(() => {
        result.current.setTimerState('running')
        result.current.timeRemaining = 60
      })

      act(() => {
        result.current.tick()
      })

      expect(result.current.timeRemaining).toBe(59)
    })

    it('should not decrement time when timer is not running', () => {
      const { result } = renderHook(() => usePomodoroStore())

      act(() => {
        result.current.setTimerState('idle')
        result.current.timeRemaining = 60
      })

      act(() => {
        result.current.tick()
      })

      expect(result.current.timeRemaining).toBe(60)
    })

    it('should trigger completion when time reaches zero', () => {
      const { result } = renderHook(() => usePomodoroStore())

      act(() => {
        result.current.setTimerState('running')
        result.current.timeRemaining = 1
        result.current.currentSessionId = 'session-123'
      })

      // Mock completeTimer to avoid actual API call
      const mockCompleteTimer = jest.fn()
      result.current.completeTimer = mockCompleteTimer

      act(() => {
        result.current.tick()
      })

      expect(mockCompleteTimer).toHaveBeenCalled()
    })
  })

  describe('Settings Actions', () => {
    it('should update settings successfully', async () => {
      const { result } = renderHook(() => usePomodoroStore())

      const updatedSettings = { ...mockSettings, work_duration: 30 }
      ;(pomodoroService.updateSettings as jest.Mock).mockResolvedValueOnce(updatedSettings)

      await act(async () => {
        await result.current.updateSettings({ work_duration: 30 })
      })

      expect(pomodoroService.updateSettings).toHaveBeenCalledWith({ work_duration: 30 })
      expect(result.current.settings).toEqual(updatedSettings)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle settings update errors', async () => {
      const { result } = renderHook(() => usePomodoroStore())

      ;(pomodoroService.updateSettings as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.updateSettings({ work_duration: 30 })
      })

      expect(result.current.error).toBe('Failed to update pomodoro settings')
      expect(result.current.isLoading).toBe(false)
    })

    it('should reset settings to defaults', async () => {
      const { result } = renderHook(() => usePomodoroStore())

      const defaultSettings = { ...mockSettings, work_duration: 25 }
      ;(pomodoroService.updateSettings as jest.Mock).mockResolvedValueOnce(defaultSettings)

      await act(async () => {
        await result.current.resetSettings()
      })

      expect(pomodoroService.updateSettings).toHaveBeenCalled()
      expect(result.current.settings).toEqual(defaultSettings)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Session Actions', () => {
    it('should fetch sessions', async () => {
      const { result } = renderHook(() => usePomodoroStore())

      ;(pomodoroService.getRecentSessions as jest.Mock).mockResolvedValueOnce(mockSessions)

      await act(async () => {
        await result.current.fetchSessions()
      })

      expect(pomodoroService.getRecentSessions).toHaveBeenCalled()
      expect(result.current.sessions).toEqual(mockSessions)
      expect(result.current.isLoading).toBe(false)
    })

    it('should fetch statistics', async () => {
      const { result } = renderHook(() => usePomodoroStore())

      ;(pomodoroService.getStatistics as jest.Mock).mockResolvedValueOnce(mockStatistics)

      await act(async () => {
        await result.current.fetchStatistics()
      })

      expect(pomodoroService.getStatistics).toHaveBeenCalled()
      expect(result.current.statistics).toEqual(mockStatistics)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle session fetch errors', async () => {
      const { result } = renderHook(() => usePomodoroStore())

      ;(pomodoroService.getRecentSessions as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.fetchSessions()
      })

      expect(result.current.error).toBe('Failed to fetch pomodoro sessions')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => usePomodoroStore())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set timer state', () => {
      const { result } = renderHook(() => usePomodoroStore())

      act(() => {
        result.current.setTimerState('paused')
      })

      expect(result.current.timerState).toBe('paused')
    })
  })
})