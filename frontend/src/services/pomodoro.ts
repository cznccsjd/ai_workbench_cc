/**
 * Pomodoro API Service
 * Provides typed interface to backend Pomodoro API endpoints
 */

import { apiClient } from '../lib/apiClient';

// Type definitions matching backend models
export interface PomodoroSession {
  id?: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  session_type: 'work' | 'short_break' | 'long_break';
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PomodoroSettings {
  id?: string;
  user_id?: string;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  long_break_interval: number;
  auto_start_breaks: boolean;
  auto_start_work: boolean;
  sound_enabled: boolean;
  sound_file?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PomodoroStatistics {
  total_sessions: number;
  completed_sessions: number;
  total_focus_time: number; // in minutes
  average_session_duration: number; // in minutes
  streak_days: number;
  today_sessions: number;
  today_focus_time: number; // in minutes
  weekly_stats: {
    date: string;
    sessions: number;
    focus_time: number;
  }[];
}

export interface CreateSessionRequest {
  start_time: string;
  duration_minutes: number;
  session_type: 'work' | 'short_break' | 'long_break';
}

export interface UpdateSessionRequest {
  end_time?: string;
  completed?: boolean;
}

export interface SessionFilters {
  start_date?: string;
  end_date?: string;
  session_type?: 'work' | 'short_break' | 'long_break';
  completed?: boolean;
  limit?: number;
  offset?: number;
}

// API service class
class PomodoroService {
  private readonly basePath = '/api/pomodoro';

  /**
   * Create a new pomodoro session
   */
  async createSession(data: CreateSessionRequest): Promise<PomodoroSession> {
    try {
      console.log('Creating pomodoro session:', data);
      const response = await apiClient.post(`${this.basePath}/sessions`, data);
      console.log('Session created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create pomodoro session:', error);
      throw new Error('Failed to create pomodoro session');
    }
  }

  /**
   * Get pomodoro sessions with optional filters
   */
  async getSessions(filters?: SessionFilters): Promise<PomodoroSession[]> {
    try {
      console.log('Fetching pomodoro sessions with filters:', filters);
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      const url = `${this.basePath}/sessions${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get(url);
      console.log(`Fetched ${response.data.length} sessions`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pomodoro sessions:', error);
      throw new Error('Failed to fetch pomodoro sessions');
    }
  }

  /**
   * Update an existing pomodoro session
   */
  async updateSession(id: string, data: UpdateSessionRequest): Promise<PomodoroSession> {
    try {
      console.log(`Updating session ${id}:`, data);
      const response = await apiClient.put(`${this.basePath}/sessions/${id}`, data);
      console.log('Session updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update pomodoro session ${id}:`, error);
      throw new Error('Failed to update pomodoro session');
    }
  }

  /**
   * Get pomodoro statistics
   */
  async getStatistics(): Promise<PomodoroStatistics> {
    try {
      console.log('Fetching pomodoro statistics');
      const response = await apiClient.get(`${this.basePath}/statistics`);
      console.log('Statistics fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pomodoro statistics:', error);
      throw new Error('Failed to fetch pomodoro statistics');
    }
  }

  /**
   * Get pomodoro settings
   */
  async getSettings(): Promise<PomodoroSettings> {
    try {
      console.log('Fetching pomodoro settings');
      const response = await apiClient.get(`${this.basePath}/settings`);
      console.log('Settings fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pomodoro settings:', error);
      throw new Error('Failed to fetch pomodoro settings');
    }
  }

  /**
   * Update pomodoro settings
   */
  async updateSettings(data: Partial<PomodoroSettings>): Promise<PomodoroSettings> {
    try {
      console.log('Updating pomodoro settings:', data);
      const response = await apiClient.put(`${this.basePath}/settings`, data);
      console.log('Settings updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update pomodoro settings:', error);
      throw new Error('Failed to update pomodoro settings');
    }
  }

  /**
   * Get active session (if any)
   */
  async getActiveSession(): Promise<PomodoroSession | null> {
    try {
      console.log('Fetching active pomodoro session');
      const sessions = await this.getSessions({
        completed: false,
        limit: 1
      });

      const activeSession = sessions.length > 0 ? sessions[0] : null;
      console.log('Active session:', activeSession);
      return activeSession;
    } catch (error) {
      console.error('Failed to fetch active pomodoro session:', error);
      return null;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(id: string, endTime: string): Promise<PomodoroSession> {
    return this.updateSession(id, {
      end_time: endTime,
      completed: true
    });
  }

  /**
   * Get today's sessions
   */
  async getTodaySessions(): Promise<PomodoroSession[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessions({
      start_date: today,
      end_date: today
    });
  }

  /**
   * Get recent sessions (last 7 days)
   */
  async getRecentSessions(): Promise<PomodoroSession[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return this.getSessions({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });
  }
}

// Export singleton instance
export const pomodoroService = new PomodoroService();

// Export types for use in components
export type {
  PomodoroSession,
  PomodoroSettings,
  PomodoroStatistics,
  CreateSessionRequest,
  UpdateSessionRequest,
  SessionFilters
};