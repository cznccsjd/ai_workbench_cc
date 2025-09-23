/**
 * 番茄钟页面对象类
 * 封装番茄钟页面的元素和操作
 */

import { Page, Locator, expect } from '@playwright/test';

export class PomodoroPage {
  private page: Page;

  // 计时器元素
  private timerDisplay: Locator;
  private minutesDisplay: Locator;
  private secondsDisplay: Locator;
  private progressBar: Locator;
  private progressCircle: Locator;

  // 控制按钮
  private startButton: Locator;
  private pauseButton: Locator;
  private stopButton: Locator;
  private resetButton: Locator;

  // 设置控件
  private workDurationInput: Locator;
  private shortBreakInput: Locator;
  private longBreakInput: Locator;
  private sessionsInput: Locator;

  // 状态显示
  private currentMode: Locator;
  private sessionCounter: Locator;
  private completedSessions: Locator;

  // 通知和声音
  private notificationToggle: Locator;
  private soundToggle: Locator;
  private volumeSlider: Locator;

  // 统计信息
  private totalTime: Locator;
  private todayStats: Locator;
  private weekStats: Locator;

  // 任务管理
  private taskInput: Locator;
  private taskList: Locator;
  private addTaskButton: Locator;

  // 主题和样式
  private themeSelector: Locator;
  private backgroundSelector: Locator;

  // 设置面板
  private settingsButton: Locator;
  private settingsPanel: Locator;

  constructor(page: Page) {
    this.page = page;

    // 初始化页面元素定位器
    this.timerDisplay = page.locator('[data-testid="timer-display"], .timer, .time-display');
    this.minutesDisplay = page.locator('[data-testid="minutes"], .minutes, .timer .minutes');
    this.secondsDisplay = page.locator('[data-testid="seconds"], .seconds, .timer .seconds');
    this.progressBar = page.locator('[data-testid="progress-bar"], .progress-bar, progress');
    this.progressCircle = page.locator('[data-testid="progress-circle"], .progress-circle, .circular-progress');

    this.startButton = page.locator('[data-testid="start"], button:has-text("开始"), .start-button');
    this.pauseButton = page.locator('[data-testid="pause"], button:has-text("暂停"), .pause-button');
    this.stopButton = page.locator('[data-testid="stop"], button:has-text("停止"), .stop-button');
    this.resetButton = page.locator('[data-testid="reset"], button:has-text("重置"), .reset-button');

    this.workDurationInput = page.locator('[data-testid="work-duration"], input[name="workDuration"], input[placeholder*="工作时长"]');
    this.shortBreakInput = page.locator('[data-testid="short-break"], input[name="shortBreak"], input[placeholder*="短休息"]');
    this.longBreakInput = page.locator('[data-testid="long-break"], input[name="longBreak"], input[placeholder*="长休息"]');
    this.sessionsInput = page.locator('[data-testid="sessions"], input[name="sessions"], input[placeholder*="会话"]');

    this.currentMode = page.locator('[data-testid="current-mode"], .mode, .status');
    this.sessionCounter = page.locator('[data-testid="session-counter"], .session-count, .counter');
    this.completedSessions = page.locator('[data-testid="completed-sessions"], .completed, .finished');

    this.notificationToggle = page.locator('[data-testid="notification-toggle"], input[name="notifications"]');
    this.soundToggle = page.locator('[data-testid="sound-toggle"], input[name="sound"]');
    this.volumeSlider = page.locator('[data-testid="volume"], input[type="range"], .volume-slider');

    this.totalTime = page.locator('[data-testid="total-time"], .total-time, .stats .total');
    this.todayStats = page.locator('[data-testid="today-stats"], .today, .stats .today');
    this.weekStats = page.locator('[data-testid="week-stats"], .week, .stats .week');

    this.taskInput = page.locator('[data-testid="task-input"], input[placeholder*="任务"], .task-input');
    this.taskList = page.locator('[data-testid="task-list"], .tasks, .task-list');
    this.addTaskButton = page.locator('[data-testid="add-task"], button:has-text("添加"), .add-task');

    this.themeSelector = page.locator('[data-testid="theme-selector"], select[name="theme"]');
    this.backgroundSelector = page.locator('[data-testid="background"], select[name="background"]');

    this.settingsButton = page.locator('[data-testid="settings"], button:has-text("设置"), .settings-button');
    this.settingsPanel = page.locator('[data-testid="settings-panel"], .settings-panel, .settings');
  }

  // 导航方法
  async goto(): Promise<void> {
    await this.page.goto('/pomodoro');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  // 计时器控制方法
  async startTimer(): Promise<void> {
    await this.startButton.click();
    await this.page.waitForTimeout(500);
  }

  async pauseTimer(): Promise<void> {
    await this.pauseButton.click();
    await this.page.waitForTimeout(500);
  }

  async stopTimer(): Promise<void> {
    await this.stopButton.click();
    await this.page.waitForTimeout(500);
  }

  async resetTimer(): Promise<void> {
    await this.resetButton.click();
    await this.page.waitForTimeout(500);
  }

  async isTimerRunning(): Promise<boolean> {
    // 检查是否显示暂停按钮（表示计时器正在运行）
    const pauseVisible = await this.pauseButton.isVisible();
    const startVisible = await this.startButton.isVisible();

    return pauseVisible && !startVisible;
  }

  async isTimerPaused(): Promise<boolean> {
    // 检查是否显示开始按钮（表示计时器已暂停）
    const startVisible = await this.startButton.isVisible();
    const currentTime = await this.getRemainingTime();

    return startVisible && currentTime.minutes > 0 || currentTime.seconds > 0;
  }

  // 时间获取方法
  async getRemainingTime(): Promise<{ minutes: number; seconds: number }> {
    const minutesText = await this.minutesDisplay.textContent() || '0';
    const secondsText = await this.secondsDisplay.textContent() || '0';

    return {
      minutes: parseInt(minutesText.replace(/\D/g, '')),
      seconds: parseInt(secondsText.replace(/\D/g, ''))
    };
  }

  async getTotalTimeInSeconds(): Promise<number> {
    const time = await this.getRemainingTime();
    return time.minutes * 60 + time.seconds;
  }

  async getCurrentMode(): Promise<string> {
    return await this.currentMode.textContent() || '';
  }

  async getSessionCount(): Promise<number> {
    const countText = await this.sessionCounter.textContent() || '0';
    return parseInt(countText.replace(/\D/g, ''));
  }

  async getCompletedSessions(): Promise<number> {
    const completedText = await this.completedSessions.textContent() || '0';
    return parseInt(completedText.replace(/\D/g, ''));
  }

  // 设置方法
  async setWorkDuration(minutes: number): Promise<void> {
    await this.workDurationInput.fill(minutes.toString());
    await this.page.waitForTimeout(300);
  }

  async setShortBreakDuration(minutes: number): Promise<void> {
    await this.shortBreakInput.fill(minutes.toString());
    await this.page.waitForTimeout(300);
  }

  async setLongBreakDuration(minutes: number): Promise<void> {
    await this.longBreakInput.fill(minutes.toString());
    await this.page.waitForTimeout(300);
  }

  async setSessionsBeforeLongBreak(sessions: number): Promise<void> {
    await this.sessionsInput.fill(sessions.toString());
    await this.page.waitForTimeout(300);
  }

  async openSettings(): Promise<void> {
    await this.settingsButton.click();
    await this.settingsPanel.waitFor({ state: 'visible' });
  }

  async closeSettings(): Promise<void> {
    const closeButton = this.settingsPanel.locator('button:has-text("关闭"), .close, .dismiss');
    await closeButton.click();
    await this.settingsPanel.waitFor({ state: 'hidden' });
  }

  // 通知和声音设置
  async enableNotifications(enable: boolean = true): Promise<void> {
    const isChecked = await this.notificationToggle.isChecked();
    if (enable !== isChecked) {
      await this.notificationToggle.click();
    }
  }

  async enableSound(enable: boolean = true): Promise<void> {
    const isChecked = await this.soundToggle.isChecked();
    if (enable !== isChecked) {
      await this.soundToggle.click();
    }
  }

  async setVolume(volume: number): Promise<void> {
    // volume should be between 0 and 100
    await this.volumeSlider.fill(volume.toString());
  }

  async getVolume(): Promise<number> {
    const value = await this.volumeSlider.inputValue();
    return parseInt(value);
  }

  // 任务管理方法
  async addTask(taskName: string): Promise<void> {
    await this.taskInput.fill(taskName);
    await this.addTaskButton.click();
    await this.page.waitForTimeout(500);
  }

  async getTasks(): Promise<string[]> {
    const taskElements = this.taskList.locator('.task-item, [data-testid="task-item"]');
    return await taskElements.allTextContents();
  }

  async completeTask(taskName: string): Promise<void> {
    const taskItem = this.taskList.locator(`text="${taskName}"`).first();
    const checkbox = taskItem.locator('input[type="checkbox"], .task-checkbox');
    await checkbox.check();
  }

  async deleteTask(taskName: string): Promise<void> {
    const taskItem = this.taskList.locator(`text="${taskName}"`).first();
    const deleteButton = taskItem.locator('button:has-text("删除"), .delete-button');
    await deleteButton.click();
  }

  async editTask(oldName: string, newName: string): Promise<void> {
    const taskItem = this.taskList.locator(`text="${oldName}"`).first();
    const editButton = taskItem.locator('button:has-text("编辑"), .edit-button');
    await editButton.click();

    const editInput = this.page.locator('input[data-editing="true"], .task-edit-input');
    await editInput.fill(newName);
    await this.page.keyboard.press('Enter');
  }

  // 统计信息方法
  async getTodayStats(): Promise<{
    sessions: number;
    minutes: number;
  }> {
    const statsText = await this.todayStats.textContent() || '';
    const sessionsMatch = statsText.match(/(\d+).*会话|session/i);
    const minutesMatch = statsText.match(/(\d+).*分钟|minute/i);

    return {
      sessions: sessionsMatch ? parseInt(sessionsMatch[1]) : 0,
      minutes: minutesMatch ? parseInt(minutesMatch[1]) : 0
    };
  }

  async getWeekStats(): Promise<{
    sessions: number;
    hours: number;
  }> {
    const statsText = await this.weekStats.textContent() || '';
    const sessionsMatch = statsText.match(/(\d+).*会话|session/i);
    const hoursMatch = statsText.match(/(\d+).*小时|hour/i);

    return {
      sessions: sessionsMatch ? parseInt(sessionsMatch[1]) : 0,
      hours: hoursMatch ? parseInt(hoursMatch[1]) : 0
    };
  }

  async getTotalTime(): Promise<string> {
    return await this.totalTime.textContent() || '';
  }

  // 主题和外观方法
  async setTheme(theme: string): Promise<void> {
    await this.themeSelector.selectOption(theme);
    await this.page.waitForTimeout(500);
  }

  async setBackground(background: string): Promise<void> {
    await this.backgroundSelector.selectOption(background);
    await this.page.waitForTimeout(500);
  }

  // 进度指示器方法
  async getProgressPercentage(): Promise<number> {
    const progressValue = await this.progressBar.getAttribute('value') ||
                         await this.progressCircle.getAttribute('data-progress') ||
                         await this.progressBar.evaluate(el => (el as HTMLProgressElement).value);

    return typeof progressValue === 'string' ? parseFloat(progressValue) : 0;
  }

  async isProgressVisible(): Promise<boolean> {
    return await this.progressBar.isVisible() || await this.progressCircle.isVisible();
  }

  // 键盘快捷键方法
  async useSpacebarToToggle(): Promise<void> {
    await this.page.keyboard.press('Space');
    await this.page.waitForTimeout(500);
  }

  async useEscapeToStop(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  async useRToReset(): Promise<void> {
    await this.page.keyboard.press('KeyR');
    await this.page.waitForTimeout(500);
  }

  // 等待方法
  async waitForTimerToComplete(timeout: number = 60000): Promise<void> {
    // 等待计时器完成（显示0:00或切换到下一阶段）
    await this.page.waitForFunction(() => {
      const minutesEl = document.querySelector('[data-testid="minutes"], .minutes');
      const secondsEl = document.querySelector('[data-testid="seconds"], .seconds');

      if (!minutesEl || !secondsEl) return false;

      const minutes = parseInt(minutesEl.textContent?.replace(/\D/g, '') || '0');
      const seconds = parseInt(secondsEl.textContent?.replace(/\D/g, '') || '0');

      return minutes === 0 && seconds === 0;
    }, { timeout });
  }

  async waitForModeChange(expectedMode: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction((mode) => {
      const modeEl = document.querySelector('[data-testid="current-mode"], .mode, .status');
      return modeEl?.textContent?.includes(mode);
    }, expectedMode, { timeout });
  }

  async waitForNotification(timeout: number = 5000): Promise<boolean> {
    try {
      // 等待浏览器通知或页面内通知
      const notification = this.page.locator('.notification, .alert, [data-testid="notification"]');
      await notification.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // 测试辅助方法
  async runQuickSession(durationSeconds: number = 5): Promise<void> {
    // 设置短时间用于测试
    await this.setWorkDuration(Math.ceil(durationSeconds / 60));

    await this.startTimer();
    await this.page.waitForTimeout(durationSeconds * 1000 + 1000); // 等待稍长时间确保完成
  }

  async simulateFullCycle(): Promise<void> {
    // 模拟完整的番茄钟循环（工作 -> 短休息 -> 工作 -> 长休息）
    await this.setWorkDuration(1); // 1分钟工作
    await this.setShortBreakDuration(1); // 1分钟短休息
    await this.setLongBreakDuration(1); // 1分钟长休息
    await this.setSessionsBeforeLongBreak(2); // 2个会话后长休息

    // 第一个工作会话
    await this.startTimer();
    await this.waitForTimerToComplete();
    await this.waitForModeChange('短休息');

    // 短休息
    await this.waitForTimerToComplete();
    await this.waitForModeChange('工作');

    // 第二个工作会话
    await this.waitForTimerToComplete();
    await this.waitForModeChange('长休息');

    // 长休息
    await this.waitForTimerToComplete();
  }

  async checkTimerAccuracy(expectedDuration: number, tolerance: number = 2): Promise<boolean> {
    const startTime = Date.now();
    await this.startTimer();

    // 等待计时器完成
    await this.waitForTimerToComplete();

    const actualDuration = (Date.now() - startTime) / 1000;
    const difference = Math.abs(actualDuration - expectedDuration);

    return difference <= tolerance;
  }

  // 获取器方法
  getTimerDisplay(): Locator {
    return this.timerDisplay;
  }

  getStartButton(): Locator {
    return this.startButton;
  }

  getPauseButton(): Locator {
    return this.pauseButton;
  }

  getStopButton(): Locator {
    return this.stopButton;
  }

  getResetButton(): Locator {
    return this.resetButton;
  }

  getProgressBar(): Locator {
    return this.progressBar;
  }

  getCurrentModeDisplay(): Locator {
    return this.currentMode;
  }

  getTaskList(): Locator {
    return this.taskList;
  }

  getSettingsPanel(): Locator {
    return this.settingsPanel;
  }

  // 数据导出方法
  async exportStats(format: 'csv' | 'json' = 'csv'): Promise<void> {
    const exportButton = this.page.locator('[data-testid="export"], button:has-text("导出")');
    await exportButton.click();

    const formatOption = this.page.locator(`[data-format="${format}"], button:has-text("${format.toUpperCase()}")`);
    await formatOption.click();
  }

  async resetAllStats(): Promise<void> {
    const resetStatsButton = this.page.locator('[data-testid="reset-stats"], button:has-text("重置统计")');
    await resetStatsButton.click();

    // 确认重置
    const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("重置")');
    await confirmButton.click();
  }

  // 全屏模式
  async enterFullscreen(): Promise<void> {
    const fullscreenButton = this.page.locator('[data-testid="fullscreen"], button:has-text("全屏")');
    await fullscreenButton.click();
  }

  async exitFullscreen(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async isFullscreen(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.fullscreenElement !== null;
    });
  }
}