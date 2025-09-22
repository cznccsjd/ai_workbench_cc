/**
 * Pomodoro Store - Enhanced with Backend API Integration
 * Manages Pomodoro timer state and synchronizes with backend
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import {
  pomodoroService,
  PomodoroSession,
  PomodoroSettings,
  PomodoroStatistics,
  CreateSessionRequest,
  UpdateSessionRequest
} from '../services/pomodoro';

// Timer states
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type SessionType = 'work' | 'short_break' | 'long_break';

// Store interfaces
interface PomodoroState {
  // Timer state
  timerState: TimerState;
  currentSessionType: SessionType;
  timeRemaining: number;
  totalDuration: number;
  sessionCount: number;
  currentSessionId: string | null;

  // Backend data
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
  statistics: PomodoroStatistics | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  isInitializing: boolean;

  // Actions
  initializeStore: () => Promise<void>;

  // Timer actions
  startTimer: () => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  completeTimer: () => Promise<void>;

  // Settings actions
  updateSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Session actions
  fetchSessions: (forceRefresh?: boolean) => Promise<void>;
  fetchStatistics: (forceRefresh?: boolean) => Promise<void>;

  // Internal actions
  tick: () => void;
  setTimerState: (state: TimerState) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default settings matching backend defaults
const DEFAULT_SETTINGS: PomodoroSettings = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  long_break_interval: 4,
  auto_start_breaks: false,
  auto_start_work: false,
  sound_enabled: true,
};

// Timer intervals for different session types
const TIMER_INTERVALS = {
  work: 25 * 60, // 25 minutes
  short_break: 5 * 60, // 5 minutes
  long_break: 15 * 60, // 15 minutes
};

const usePomodoroStore = create<PomodoroState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          timerState: 'idle',
          currentSessionType: 'work',
          timeRemaining: 25 * 60,
          totalDuration: 25 * 60,
          sessionCount: 0,
          currentSessionId: null,
          sessions: [],
          settings: DEFAULT_SETTINGS,
          statistics: null,
          isLoading: false,
          error: null,
          isInitializing: true,

          // Initialize store - fetch data from backend
          initializeStore: async () => {
            const state = get();
            if (!state.isInitializing) return;

            set({ isLoading: true, error: null });

            try {
              console.log('Initializing pomodoro store...');

              // Fetch settings, statistics, and recent sessions in parallel
              const [settings, statistics, sessions] = await Promise.all([
                pomodoroService.getSettings().catch(err => {
                  console.warn('Failed to fetch settings, using defaults:', err);
                  return DEFAULT_SETTINGS;
                }),
                pomodoroService.getStatistics().catch(err => {
                  console.warn('Failed to fetch statistics:', err);
                  return null;
                }),
                pomodoroService.getRecentSessions().catch(err => {
                  console.warn('Failed to fetch sessions:', err);
                  return [];
                })
              ]);

              // Check for active session
              const activeSession = await pomodoroService.getActiveSession().catch(() => null);

              const updates: Partial<PomodoroState> = {
                settings,
                statistics,
                sessions,
                isInitializing: false,
                isLoading: false,
              };

              // If there's an active session, restore timer state
              if (activeSession) {
                const now = new Date();
                const startTime = new Date(activeSession.start_time);
                const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                const remainingTime = Math.max(0, (activeSession.duration_minutes * 60) - elapsedSeconds);

                updates.currentSessionId = activeSession.id || null;
                updates.currentSessionType = activeSession.session_type;
                updates.timeRemaining = remainingTime;
                updates.totalDuration = activeSession.duration_minutes * 60;
                updates.timerState = remainingTime > 0 ? 'running' : 'completed';
              } else {
                // Set timer duration based on settings
                updates.timeRemaining = settings.work_duration * 60;
                updates.totalDuration = settings.work_duration * 60;
              }

              set(updates);
              console.log('Pomodoro store initialized successfully');

            } catch (error) {
              console.error('Failed to initialize pomodoro store:', error);
              set({
                error: 'Failed to initialize pomodoro data',
                isInitializing: false,
                isLoading: false,
              });
            }
          },

          // Timer actions
          startTimer: async () => {
            const state = get();
            if (state.timerState !== 'idle') return;

            set({ isLoading: true, error: null });

            try {
              // Create session on backend
              const sessionRequest: CreateSessionRequest = {
                start_time: new Date().toISOString(),
                duration_minutes: Math.floor(state.timeRemaining / 60),
                session_type: state.currentSessionType,
              };

              const session = await pomodoroService.createSession(sessionRequest);

              set({
                timerState: 'running',
                currentSessionId: session.id || null,
                isLoading: false,
                error: null,
              });

              console.log(`Started ${state.currentSessionType} session with ID: ${session.id}`);

            } catch (error) {
              console.error('Failed to start timer:', error);
              set({
                error: 'Failed to start pomodoro session',
                isLoading: false,
              });
            }
          },

          pauseTimer: () => {
            const state = get();
            if (state.timerState === 'running') {
              set({ timerState: 'paused' });
              console.log('Timer paused');
            }
          },

          resumeTimer: () => {
            const state = get();
            if (state.timerState === 'paused') {
              set({ timerState: 'running' });
              console.log('Timer resumed');
            }
          },

          stopTimer: async () => {
            const state = get();
            if (state.timerState === 'idle') return;

            set({ isLoading: true });

            try {
              // Update session as incomplete on backend
              if (state.currentSessionId) {
                await pomodoroService.updateSession(state.currentSessionId, {
                  end_time: new Date().toISOString(),
                  completed: false,
                });
              }

              // Reset timer to default duration for current session type
              const duration = state.settings[`${state.currentSessionType}_duration` as keyof PomodoroSettings] as number;

              set({
                timerState: 'idle',
                timeRemaining: duration * 60,
                totalDuration: duration * 60,
                currentSessionId: null,
                isLoading: false,
              });

              console.log('Timer stopped and session updated');

            } catch (error) {
              console.error('Failed to stop timer:', error);
              set({
                error: 'Failed to stop pomodoro session',
                isLoading: false,
              });
            }
          },

          completeTimer: async () => {
            const state = get();
            if (state.timerState === 'idle') return;

            set({ isLoading: true });

            try {
              // Complete session on backend
              if (state.currentSessionId) {
                await pomodoroService.completeSession(state.currentSessionId, new Date().toISOString());
              }

              // Determine next session type
              let nextSessionType: SessionType;
              let nextSessionCount = state.sessionCount;

              if (state.currentSessionType === 'work') {
                nextSessionCount++;
                if (nextSessionCount % state.settings.long_break_interval === 0) {
                  nextSessionType = 'long_break';
                } else {
                  nextSessionType = 'short_break';
                }
              } else {
                nextSessionType = 'work';
              }

              // Set duration for next session
              const nextDuration = state.settings[`${nextSessionType}_duration` as keyof PomodoroSettings] as number;

              set({
                timerState: 'completed',
                sessionCount: nextSessionCount,
                currentSessionId: null,
                isLoading: false,
              });

              console.log(`Completed ${state.currentSessionType} session`);

              // Auto-start next session if enabled
              setTimeout(() => {
                const currentState = get();
                if (currentState.timerState === 'completed') {
                  if (state.currentSessionType === 'work' && state.settings.auto_start_breaks) {
                    get().startNewSession(nextSessionType);
                  } else if (state.currentSessionType !== 'work' && state.settings.auto_start_work) {
                    get().startNewSession('work');
                  } else {
                    // Reset for manual start
                    set({
                      currentSessionType: nextSessionType,
                      timeRemaining: nextDuration * 60,
                      totalDuration: nextDuration * 60,
                      timerState: 'idle',
                    });
                  }
                }
              }, 1000);

            } catch (error) {
              console.error('Failed to complete timer:', error);
              set({
                error: 'Failed to complete pomodoro session',
                isLoading: false,
              });
            }
          },

          // Helper method to start a new session
          startNewSession: (sessionType: SessionType) => {
            const state = get();
            const duration = state.settings[`${sessionType}_duration` as keyof PomodoroSettings] as number;

            set({
              currentSessionType: sessionType,
              timeRemaining: duration * 60,
              totalDuration: duration * 60,
              timerState: 'idle',
            });
          },

          // Settings actions
          updateSettings: async (newSettings: Partial<PomodoroSettings>) => {
            const state = get();
            set({ isLoading: true, error: null });

            try {
              const updatedSettings = await pomodoroService.updateSettings(newSettings);

              // Update timer duration if current session type settings changed
              const currentType = state.currentSessionType;
              const durationKey = `${currentType}_duration` as keyof PomodoroSettings;

              const updates: Partial<PomodoroState> = {
                settings: updatedSettings,
                isLoading: false,
              };

              // Update timer if settings changed and timer is idle
              if (state.timerState === 'idle' && newSettings[durationKey] !== undefined) {
                updates.timeRemaining = updatedSettings[durationKey] as number * 60;
                updates.totalDuration = updatedSettings[durationKey] as number * 60;
              }

              set(updates);
              console.log('Settings updated successfully');

            } catch (error) {
              console.error('Failed to update settings:', error);
              set({
                error: 'Failed to update pomodoro settings',
                isLoading: false,
              });
            }
          },

          resetSettings: async () => {
            set({ isLoading: true, error: null });

            try {
              const resetSettings = await pomodoroService.updateSettings(DEFAULT_SETTINGS);

              set({
                settings: resetSettings,
                isLoading: false,
              });

              console.log('Settings reset to defaults');

            } catch (error) {
              console.error('Failed to reset settings:', error);
              set({
                error: 'Failed to reset pomodoro settings',
                isLoading: false,
              });
            }
          },

          // Session actions
          fetchSessions: async (forceRefresh = false) => {
            const state = get();
            if (!forceRefresh && state.sessions.length > 0) return;

            set({ isLoading: true });

            try {
              const sessions = await pomodoroService.getRecentSessions();
              set({
                sessions,
                isLoading: false,
              });
            } catch (error) {
              console.error('Failed to fetch sessions:', error);
              set({
                error: 'Failed to fetch pomodoro sessions',
                isLoading: false,
              });
            }
          },

          fetchStatistics: async (forceRefresh = false) => {
            const state = get();
            if (!forceRefresh && state.statistics) return;

            set({ isLoading: true });

            try {
              const statistics = await pomodoroService.getStatistics();
              set({
                statistics,
                isLoading: false,
              });
            } catch (catchError) {
              console.error('Failed to fetch statistics:', catchError);
              set({
                error: 'Failed to fetch pomodoro statistics',
                isLoading: false,
              });
            }
          },

          // Timer tick - handle countdown
          tick: () => {
            const state = get();
            if (state.timerState !== 'running') return;

            if (state.timeRemaining > 0) {
              set({ timeRemaining: state.timeRemaining - 1 });
            } else {
              // Timer completed
              get().completeTimer();
            }
          },

          // UI helpers
          setTimerState: (timerState: TimerState) => set({ timerState }),
          setError: (error: string | null) => set({ error }),
          clearError: () => set({ error: null }),
        }),
        {
          name: 'pomodoro-store',
          partialize: (state) => ({
            // Only persist UI-related state, not backend data
            timerState: state.timerState,
            currentSessionType: state.currentSessionType,
            timeRemaining: state.timeRemaining,
            totalDuration: state.totalDuration,
            sessionCount: state.sessionCount,
            currentSessionId: state.currentSessionId,
          }),
        }
      )
    ),
    {
      name: 'pomodoro-store',
    }
  )
);

// Timer tick subscription
let timerInterval: NodeJS.Timeout | null = null;

// Subscribe to timer state changes
usePomodoroStore.subscribe(
  (state) => state.timerState,
  (timerState) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (timerState === 'running') {
      timerInterval = setInterval(() => {
        usePomodoroStore.getState().tick();
      }, 1000);
    }
  }
);

// Initialize store on mount (in browser only)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  usePomodoroStore.getState().initializeStore();
}

export default usePomodoroStore;