/**
 * E2E测试环境配置和辅助工具
 */

import { Page, BrowserContext, expect } from '@playwright/test';

export interface TestEnvironment {
  frontendURL: string;
  backendURL: string;
  databaseURL?: string;
  apiToken?: string;
}

export const DEFAULT_TEST_ENV: TestEnvironment = {
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendURL: process.env.BACKEND_URL || 'http://localhost:8000',
  databaseURL: process.env.TEST_DATABASE_URL || 'sqlite:///test_boards.db',
  apiToken: process.env.TEST_API_TOKEN
};

export class TestEnvironmentSetup {
  private page: Page;
  private context: BrowserContext;
  private env: TestEnvironment;

  constructor(page: Page, context: BrowserContext, env: TestEnvironment = DEFAULT_TEST_ENV) {
    this.page = page;
    this.context = context;
    this.env = env;
  }

  /**
   * 初始化测试环境
   */
  async setup(): Promise<void> {
    // 设置视口大小
    await this.page.setViewportSize({ width: 1280, height: 720 });

    // 设置超时时间
    this.page.setDefaultTimeout(10000);
    this.page.setDefaultNavigationTimeout(30000);

    // 清理浏览器状态
    await this.clearBrowserState();

    // 等待服务就绪
    await this.waitForServices();

    // 设置测试用的localStorage值
    await this.setupTestConfig();
  }

  /**
   * 清理浏览器状态
   */
  async clearBrowserState(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await this.context.clearCookies();
  }

  /**
   * 等待前后端服务就绪
   */
  async waitForServices(): Promise<void> {
    // 检查前端服务
    let frontendReady = false;
    let backendReady = false;

    // 等待前端服务
    for (let i = 0; i < 10; i++) {
      try {
        const response = await this.page.request.get(this.env.frontendURL);
        if (response.ok()) {
          frontendReady = true;
          break;
        }
      } catch (error) {
        console.log(`Waiting for frontend service... (${i + 1}/10)`);
        await this.page.waitForTimeout(2000);
      }
    }

    // 等待后端服务
    for (let i = 0; i < 10; i++) {
      try {
        const response = await this.page.request.get(`${this.env.backendURL}/health`);
        if (response.ok()) {
          backendReady = true;
          break;
        }
      } catch (error) {
        console.log(`Waiting for backend service... (${i + 1}/10)`);
        await this.page.waitForTimeout(2000);
      }
    }

    if (!frontendReady) {
      throw new Error(`Frontend service not available at ${this.env.frontendURL}`);
    }

    if (!backendReady) {
      console.warn(`Backend service not available at ${this.env.backendURL}, tests will run with mocked data`);
    }
  }

  /**
   * 设置测试配置
   */
  async setupTestConfig(): Promise<void> {
    await this.page.evaluate((config) => {
      localStorage.setItem('test-mode', 'true');
      localStorage.setItem('api-base-url', config.backendURL);

      // 设置测试主题
      localStorage.setItem('theme', 'light');

      // 设置测试语言
      localStorage.setItem('language', 'zh-CN');

      // 禁用某些动画以加快测试
      localStorage.setItem('reduce-motion', 'true');
    }, this.env);
  }

  /**
   * 截图助手
   */
  async takeScreenshot(name: string, options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
    mask?: Array<any>;
  }): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;

    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: options?.fullPage ?? true,
      clip: options?.clip,
      mask: options?.mask
    });
  }

  /**
   * 等待网络空闲
   */
  async waitForNetworkIdle(timeout: number = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * 等待元素可见并可交互
   */
  async waitForElementReady(selector: string, timeout: number = 10000): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    await element.waitFor({ state: 'attached', timeout });

    // 确保元素不被其他元素遮挡
    await expect(element).toBeVisible();
    await expect(element).toBeEnabled();
  }

  /**
   * 模拟网络慢速连接
   */
  async simulateSlowNetwork(): Promise<void> {
    const client = await this.context.newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 500 * 1024, // 500KB/s
      uploadThroughput: 500 * 1024,   // 500KB/s
      latency: 100 // 100ms
    });
  }

  /**
   * 模拟移动设备
   */
  async simulateMobileDevice(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.evaluate(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });
    });
  }

  /**
   * 模拟离线状态
   */
  async simulateOffline(): Promise<void> {
    await this.context.setOffline(true);
  }

  /**
   * 恢复在线状态
   */
  async simulateOnline(): Promise<void> {
    await this.context.setOffline(false);
  }

  /**
   * 注入测试用的CSS样式
   */
  async injectTestStyles(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        /* 测试模式下的特殊样式 */
        [data-test-mode="true"] {
          border: 2px dashed orange !important;
        }

        /* 加快动画速度 */
        *, *::before, *::after {
          animation-duration: 0.1s !important;
          animation-delay: 0s !important;
          transition-duration: 0.1s !important;
          transition-delay: 0s !important;
        }

        /* 高亮测试元素 */
        [data-testid] {
          position: relative;
        }

        [data-testid]::after {
          content: attr(data-testid);
          position: absolute;
          top: -20px;
          left: 0;
          font-size: 10px;
          background: rgba(255, 165, 0, 0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          pointer-events: none;
          z-index: 9999;
          display: none;
        }

        body[data-show-testids="true"] [data-testid]::after {
          display: block;
        }
      `
    });
  }

  /**
   * 显示或隐藏测试ID标签
   */
  async toggleTestIdLabels(show: boolean = true): Promise<void> {
    await this.page.evaluate((shouldShow) => {
      document.body.setAttribute('data-show-testids', shouldShow.toString());
    }, show);
  }

  /**
   * 监听控制台错误
   */
  async monitorConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    this.page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    return errors;
  }

  /**
   * 验证页面性能
   */
  async checkPagePerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
  }> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paints = performance.getEntriesByType('paint');

      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paints.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
  }

  /**
   * 验证可访问性
   */
  async checkAccessibility(): Promise<boolean> {
    // 检查基本的可访问性要求
    const issues: string[] = [];

    // 检查是否有alt属性缺失的图片
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      issues.push(`Found ${imagesWithoutAlt} images without alt text`);
    }

    // 检查是否有aria-label或其他可访问性属性
    const buttonsWithoutLabel = await this.page.locator('button:not([aria-label]):not([title]):not(:has-text(""))').count();
    if (buttonsWithoutLabel > 0) {
      issues.push(`Found ${buttonsWithoutLabel} buttons without accessible labels`);
    }

    // 检查颜色对比度（简单检查）
    const lowContrastElements = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // 这是一个简化的对比度检查
        if (color === backgroundColor) {
          count++;
        }
      });

      return count;
    });

    if (lowContrastElements > 0) {
      issues.push(`Found ${lowContrastElements} elements with potential contrast issues`);
    }

    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
      return false;
    }

    return true;
  }

  /**
   * 清理测试环境
   */
  async cleanup(): Promise<void> {
    // 清理浏览器状态
    await this.clearBrowserState();

    // 移除测试样式
    await this.page.evaluate(() => {
      const testStyles = document.querySelectorAll('style[data-test="true"]');
      testStyles.forEach(style => style.remove());
    });

    // 恢复正常网络状态
    await this.simulateOnline();
  }
}

/**
 * 测试断言辅助函数
 */
export class TestAssertions {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 验证页面标题
   */
  async expectPageTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * 验证URL
   */
  async expectURL(expectedURL: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedURL);
  }

  /**
   * 验证元素文本内容
   */
  async expectElementText(selector: string, expectedText: string | RegExp): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(expectedText);
  }

  /**
   * 验证元素可见性
   */
  async expectElementVisible(selector: string, shouldBeVisible: boolean = true): Promise<void> {
    const element = this.page.locator(selector);
    if (shouldBeVisible) {
      await expect(element).toBeVisible();
    } else {
      await expect(element).not.toBeVisible();
    }
  }

  /**
   * 验证元素数量
   */
  async expectElementCount(selector: string, expectedCount: number): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(expectedCount);
  }

  /**
   * 验证表单字段值
   */
  async expectInputValue(selector: string, expectedValue: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }

  /**
   * 验证元素包含特定class
   */
  async expectElementHasClass(selector: string, className: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveClass(new RegExp(className));
  }

  /**
   * 验证元素属性
   */
  async expectElementAttribute(selector: string, attributeName: string, expectedValue: string): Promise<void> {
    await expect(this.page.locator(selector)).toHaveAttribute(attributeName, expectedValue);
  }

  /**
   * 验证本地存储值
   */
  async expectLocalStorageValue(key: string, expectedValue: string): Promise<void> {
    const value = await this.page.evaluate((k) => localStorage.getItem(k), key);
    expect(value).toBe(expectedValue);
  }

  /**
   * 验证网络请求
   */
  async expectNetworkRequest(urlPattern: string | RegExp, method: string = 'GET'): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Expected ${method} request to ${urlPattern} was not made within timeout`));
      }, 10000);

      this.page.on('request', (request) => {
        if (request.method() === method &&
            (typeof urlPattern === 'string' ?
             request.url().includes(urlPattern) :
             urlPattern.test(request.url()))) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
}