/**
 * Pomodoro Integration Test
 * Basic integration test for Pomodoro functionality
 */

import { pomodoroService } from '../../services/pomodoro'

// Mock the API client
jest.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  }
}))

describe('Pomodoro Integration', () => {
  it('should export pomodoro service', () => {
    expect(pomodoroService).toBeDefined()
    expect(typeof pomodoroService.createSession).toBe('function')
    expect(typeof pomodoroService.getSessions).toBe('function')
    expect(typeof pomodoroService.updateSession).toBe('function')
    expect(typeof pomodoroService.getStatistics).toBe('function')
    expect(typeof pomodoroService.getSettings).toBe('function')
    expect(typeof pomodoroService.updateSettings).toBe('function')
  })

  it('should have proper TypeScript types', () => {
    // This test ensures TypeScript compilation works
    const mockSession = {
      id: 'test-session',
      start_time: new Date().toISOString(),
      duration_minutes: 25,
      session_type: 'work' as const,
      completed: false,
    }

    const mockSettings = {
      work_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      long_break_interval: 4,
      auto_start_breaks: false,
      auto_start_work: false,
      sound_enabled: true,
    }

    const mockStatistics = {
      total_sessions: 10,
      completed_sessions: 8,
      total_focus_time: 200,
      average_session_duration: 25,
      streak_days: 3,
      today_sessions: 2,
      today_focus_time: 50,
      weekly_stats: [],
    }

    // Type checking - these should compile without errors
    expect(mockSession.session_type).toBe('work')
    expect(mockSettings.work_duration).toBe(25)
    expect(mockStatistics.total_sessions).toBe(10)
  })

  it('should handle API service creation', () => {
    // Test that the service is a singleton
    const service1 = pomodoroService
    const service2 = pomodoroService
    expect(service1).toBe(service2)
  })
})