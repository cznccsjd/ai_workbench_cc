// AI工作台页面类
// 封装AI工作台的主要页面元素和操作

import { Page, Locator, expect } from '@playwright/test';

export class AIWorkbenchPage {
  private page: Page;
  private navigationMenu: Locator;
  private aiNotepadLink: Locator;
  private aiChatLink: Locator;
  private pomodoroLink: Locator;
  private projectsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigationMenu = page.locator('[data-testid="navigation-menu"]');
    this.aiNotepadLink = page.locator('a[href*="ai-notepad"], a:has-text("AI记事本")');
    this.aiChatLink = page.locator('a[href*="ai-chat"], a:has-text("AI对话")');
    this.pomodoroLink = page.locator('a[href*="pomodoro"], a:has-text("番茄钟")');
    this.projectsLink = page.locator('a[href*="projects"], a:has-text("项目管理")');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAINotepad() {
    await this.aiNotepadLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAIChat() {
    await this.aiChatLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToPomodoro() {
    await this.pomodoroLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProjects() {
    await this.projectsLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentPageTitle() {
    return await this.page.title();
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  async isNavigationVisible() {
    return await this.navigationMenu.isVisible();
  }

  async getAllNavigationLinks() {
    return this.navigationMenu.locator('a');
  }

  async searchForText(text: string) {
    const searchInput = this.page.locator('input[type="search"], input[placeholder*="搜索"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(text);
      await searchInput.press('Enter');
    }
  }

  async getThemeToggle() {
    return this.page.locator('button:has-text("主题"), button[data-testid="theme-toggle"]');
  }

  async toggleTheme() {
    const themeToggle = await this.getThemeToggle();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    }
  }

  async getCurrentTheme() {
    return await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async getPageMetrics() {
    return await this.page.evaluate(() => {
      return {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime,
      };
    });
  }

  async isLoadingSpinnerVisible() {
    const spinner = this.page.locator('[data-testid="loading-spinner"], .loading, .spinner');
    return await spinner.isVisible();
  }

  async waitForLoadingToComplete() {
    const spinner = this.page.locator('[data-testid="loading-spinner"], .loading, .spinner');
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async getErrorMessage() {
    return this.page.locator('[data-testid="error-message"], .error, .alert-error');
  }

  async isErrorMessageVisible() {
    const errorMessage = await this.getErrorMessage();
    return await errorMessage.isVisible();
  }

  async closeErrorMessage() {
    const errorMessage = await this.getErrorMessage();
    const closeButton = errorMessage.locator('button:has-text("✕"), .close');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  async getSuccessMessage() {
    return this.page.locator('[data-testid="success-message"], .success, .alert-success');
  }

  async isSuccessMessageVisible() {
    const successMessage = await this.getSuccessMessage();
    return await successMessage.isVisible();
  }

  async waitForNetworkIdle(timeout: number = 5000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async reloadPage() {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  async goBack() {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  async goForward() {
    await this.page.goForward();
    await this.waitForPageLoad();
  }

  async getLocalStorageItem(key: string) {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  async setLocalStorageItem(key: string, value: string) {
    await this.page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async getSessionStorageItem(key: string) {
    return await this.page.evaluate((k) => sessionStorage.getItem(k), key);
  }

  async setSessionStorageItem(key: string, value: string) {
    await this.page.evaluate(({ k, v }) => sessionStorage.setItem(k, v), { k: key, v: value });
  }

  async clearSessionStorage() {
    await this.page.evaluate(() => sessionStorage.clear());
  }

  async getCookies() {
    return await this.page.context().cookies();
  }

  async addCookie(cookie: any) {
    await this.page.context().addCookies([cookie]);
  }

  async clearCookies() {
    await this.page.context().clearCookies();
  }
}