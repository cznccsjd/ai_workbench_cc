/**
 * Pomodoro Service Tests
 * Tests for API service functions with mocked backend responses
 */

import { pomodoroService } from '../../services/pomodoro'
import { apiClient } from '../../lib/apiClient'

// Mock the API client
jest.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
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

describe('PomodoroService', () => {
  const mockSession = {
    id: 'session-123',
    user_id: 'user-456',
    start_time: '2024-01-01T10:00:00Z',
    end_time: null,
    duration_minutes: 25,
    session_type: 'work' as const,
    completed: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  }

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
    total_focus_time: 1050, // 17.5 hours
    average_session_duration: 25,
    streak_days: 7,
    today_sessions: 3,
    today_focus_time: 75, // 1.25 hours
    weekly_stats: [
      { date: '2024-01-01', sessions: 5, focus_time: 125 },
      { date: '2024-01-02', sessions: 4, focus_time: 100 },
    ],
  }

  describe('createSession', () => {
    it('should create a new pomodoro session successfully', async () => {
      const createRequest = {
        start_time: '2024-01-01T10:00:00Z',
        duration_minutes: 25,
        session_type: 'work' as const,
      }

      ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSession })

      const result = await pomodoroService.createSession(createRequest)

      expect(apiClient.post).toHaveBeenCalledWith('/api/pomodoro/sessions', createRequest)
      expect(result).toEqual(mockSession)
    })

    it('should handle errors when creating a session', async () => {
      const createRequest = {
        start_time: '2024-01-01T10:00:00Z',
        duration_minutes: 25,
        session_type: 'work' as const,
      }

      ;(apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(pomodoroService.createSession(createRequest)).rejects.toThrow(
        'Failed to create pomodoro session'
      )
    })
  })

  describe('getSessions', () => {
    it('should fetch sessions without filters', async () => {
      const mockSessions = [mockSession]
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSessions })

      const result = await pomodoroService.getSessions()

      expect(apiClient.get).toHaveBeenCalledWith('/api/pomodoro/sessions')
      expect(result).toEqual(mockSessions)
    })

    it('should fetch sessions with filters', async () => {
      const mockSessions = [mockSession]
      const filters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        session_type: 'work' as const,
        completed: true,
        limit: 10,
        offset: 0,
      }

      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSessions })

      const result = await pomodoroService.getSessions(filters)

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/pomodoro/sessions?start_date=2024-01-01&end_date=2024-01-31&session_type=work&completed=true&limit=10&offset=0'
      )
      expect(result).toEqual(mockSessions)
    })

    it('should handle errors when fetching sessions', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(pomodoroService.getSessions()).rejects.toThrow(
        'Failed to fetch pomodoro sessions'
      )
    })
  })

  describe('updateSession', () => {
    it('should update a session successfully', async () => {
      const updateData = {
        end_time: '2024-01-01T10:25:00Z',
        completed: true,
      }

      const updatedSession = { ...mockSession, ...updateData }
      ;(apiClient.put as jest.Mock).mockResolvedValueOnce({ data: updatedSession })

      const result = await pomodoroService.updateSession('session-123', updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/api/pomodoro/sessions/session-123', updateData)
      expect(result).toEqual(updatedSession)
    })

    it('should handle errors when updating a session', async () => {
      const updateData = {
        end_time: '2024-01-01T10:25:00Z',
        completed: true,
      }

      ;(apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(pomodoroService.updateSession('session-123', updateData)).rejects.toThrow(
        'Failed to update pomodoro session'
      )
    })
  })

  describe('getStatistics', () => {
    it('should fetch statistics successfully', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockStatistics })

      const result = await pomodoroService.getStatistics()

      expect(apiClient.get).toHaveBeenCalledWith('/api/pomodoro/statistics')
      expect(result).toEqual(mockStatistics)
    })

    it('should handle errors when fetching statistics', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(pomodoroService.getStatistics()).rejects.toThrow(
        'Failed to fetch pomodoro statistics'
      )
    })
  })

  describe('getSettings', () => {
    it('should fetch settings successfully', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSettings })

      const result = await pomodoroService.getSettings()

      expect(apiClient.get).toHaveBeenCalledWith('/api/pomodoro/settings')
      expect(result).toEqual(mockSettings)
    })

    it('should handle errors when fetching settings', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(pomodoroService.getSettings()).rejects.toThrow(
        'Failed to fetch pomodoro settings'
      )
    })
  })

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const updateData = { work_duration: 30 }
      const updatedSettings = { ...mockSettings, ...updateData }

      ;(apiClient.put as jest.Mock).mockResolvedValueOnce({ data: updatedSettings })

      const result = await pomodoroService.updateSettings(updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/api/pomodoro/settings', updateData)
      expect(result).toEqual(updatedSettings)
    })

    it('should handle errors when updating settings', async () => {
      const updateData = { work_duration: 30 }

      ;(apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(pomodoroService.updateSettings(updateData)).rejects.toThrow(
        'Failed to update pomodoro settings'
      )
    })
  })

  describe('getActiveSession', () => {
    it('should return active session when one exists', async () => {
      const activeSession = { ...mockSession, completed: false }
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [activeSession] })

      const result = await pomodoroService.getActiveSession()

      expect(apiClient.get).toHaveBeenCalledWith('/api/pomodoro/sessions?completed=false&limit=1')
      expect(result).toEqual(activeSession)
    })

    it('should return null when no active session exists', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] })

      const result = await pomodoroService.getActiveSession()

      expect(apiClient.get).toHaveBeenCalledWith('/api/pomodoro/sessions?completed=false&limit=1')
      expect(result).toBeNull()
    })

    it('should return null when API call fails', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await pomodoroService.getActiveSession()

      expect(apiClient.get).toHaveBeenCalledWith('/api/pomodoro/sessions?completed=false&limit=1')
      expect(result).toBeNull()
    })
  })

  describe('completeSession', () => {
    it('should complete a session successfully', async () => {
      const endTime = '2024-01-01T10:25:00Z'
      const completedSession = { ...mockSession, end_time: endTime, completed: true }

      ;(apiClient.put as jest.Mock).mockResolvedValueOnce({ data: completedSession })

      const result = await pomodoroService.completeSession('session-123', endTime)

      expect(apiClient.put).toHaveBeenCalledWith('/api/pomodoro/sessions/session-123', {
        end_time: endTime,
        completed: true,
      })
      expect(result).toEqual(completedSession)
    })
  })

  describe('getTodaySessions', () => {
    it('should fetch today\'s sessions', async () => {
      const mockSessions = [mockSession]
      const today = new Date().toISOString().split('T')[0]
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSessions })

      const result = await pomodoroService.getTodaySessions()

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/pomodoro/sessions?start_date=${today}&end_date=${today}`
      )
      expect(result).toEqual(mockSessions)
    })
  })

  describe('getRecentSessions', () => {
    it('should fetch recent sessions (last 7 days)', async () => {
      const mockSessions = [mockSession]
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockSessions })

      const result = await pomodoroService.getRecentSessions()

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/pomodoro/sessions?start_date=${startDateStr}&end_date=${endDateStr}`
      )
      expect(result).toEqual(mockSessions)
    })
  })
})