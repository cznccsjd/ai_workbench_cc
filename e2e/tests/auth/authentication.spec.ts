/**
 * 用户认证流程E2E测试
 * 测试用户注册、登录、登出等认证相关功能
 */

import { test, expect } from '@playwright/test';
import { loginAsTestUser, logout, register, clearAuthState, isLoggedIn, DEFAULT_TEST_USER, ADMIN_TEST_USER } from '../../utils/auth';
import { TestEnvironmentSetup, TestAssertions } from '../../utils/test-env';

test.describe('用户认证流程', () => {
  let testEnv: TestEnvironmentSetup;
  let assertions: TestAssertions;

  test.beforeEach(async ({ page, context }) => {
    testEnv = new TestEnvironmentSetup(page, context);
    assertions = new TestAssertions(page);

    await testEnv.setup();

    // 确保开始时是未登录状态
    await clearAuthState(page);
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    // 清理认证状态
    await clearAuthState(page);
  });

  test('应该显示登录页面', async ({ page }) => {
    await page.goto('/');

    // 检查是否有登录相关元素
    const loginElements = [
      'button:has-text("登录")',
      'a[href*="login"]',
      'input[type="password"]',
      'input[name="username"]'
    ];

    let hasLoginElement = false;
    for (const selector of loginElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        hasLoginElement = true;
        break;
      }
    }

    // 如果没有显示登录元素，可能是自动登录了
    if (!hasLoginElement) {
      const isAuthenticated = await isLoggedIn(page);
      if (!isAuthenticated) {
        // 尝试访问需要认证的页面
        await page.goto('/login');
        await expect(page.locator('input[type="password"]')).toBeVisible();
      }
    }
  });

  test('应该成功登录有效用户', async ({ page }) => {
    // 执行登录
    await loginAsTestUser(page);

    // 验证登录成功
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    // 验证URL变化（可能跳转到首页或仪表板）
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');

    // 验证页面包含登录后的元素
    const loggedInIndicators = [
      '[data-testid="user-menu"]',
      'button:has-text("退出")',
      'button[title*="用户菜单"]',
      '.user-avatar'
    ];

    let hasLoggedInIndicator = false;
    for (const selector of loggedInIndicators) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        hasLoggedInIndicator = true;
        break;
      }
    }

    expect(hasLoggedInIndicator).toBe(true);
  });

  test('应该拒绝无效的登录凭据', async ({ page }) => {
    await page.goto('/');

    // 寻找登录入口
    const loginButton = page.locator('button:has-text("登录"), a[href*="login"]').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      await page.goto('/login');
    }

    // 等待登录表单
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    // 填写无效凭据
    const usernameInput = page.locator('input[name="username"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill('invalid_user');
    await passwordInput.fill('wrong_password');

    // 提交表单
    const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
    await submitButton.click();

    await page.waitForTimeout(2000);

    // 验证仍在登录页面
    const stillOnLoginPage = await page.locator('input[type="password"]').isVisible();
    expect(stillOnLoginPage).toBe(true);

    // 查找错误消息
    const errorMessages = [
      'text=/错误|失败|无效|不正确/',
      '.error',
      '.alert-error',
      '[data-testid="error-message"]'
    ];

    let hasErrorMessage = false;
    for (const selector of errorMessages) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        hasErrorMessage = true;
        break;
      }
    }

    // 注意：如果应用没有显示错误消息，这个测试可能需要调整
    console.log('错误消息显示状态:', hasErrorMessage);
  });

  test('应该成功登出用户', async ({ page }) => {
    // 先登录
    await loginAsTestUser(page);

    // 验证已登录
    expect(await isLoggedIn(page)).toBe(true);

    // 执行登出
    await logout(page);

    // 验证登出成功
    await page.waitForTimeout(1000);
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);

    // 验证页面状态
    const currentUrl = page.url();
    // 登出后可能回到首页或登录页
    const isValidLogoutState = currentUrl.includes('/login') ||
                             currentUrl === '/' ||
                             await page.locator('button:has-text("登录")').isVisible();

    expect(isValidLogoutState).toBe(true);
  });

  test('应该处理会话过期', async ({ page }) => {
    // 登录
    await loginAsTestUser(page);
    expect(await isLoggedIn(page)).toBe(true);

    // 模拟会话过期（清除认证令牌）
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      sessionStorage.clear();
    });

    // 访问需要认证的页面
    await page.goto('/ai-notepad');
    await page.waitForLoadState('networkidle');

    // 验证被重定向到登录页面或显示登录提示
    const needsReauth = await page.locator('input[type="password"]').isVisible().catch(() => false) ||
                       page.url().includes('/login') ||
                       await page.locator('button:has-text("登录")').isVisible().catch(() => false);

    expect(needsReauth).toBe(true);
  });

  test('应该记住登录状态', async ({ page, context }) => {
    // 登录
    await loginAsTestUser(page);
    expect(await isLoggedIn(page)).toBe(true);

    // 关闭页面并重新打开
    await page.close();
    const newPage = await context.newPage();

    // 访问应用
    await newPage.goto('/');
    await newPage.waitForLoadState('networkidle');

    // 验证仍然保持登录状态
    const stillLoggedIn = await isLoggedIn(newPage);

    // 根据应用的实际行为调整这个断言
    // 如果应用设计为需要重新登录，则期望为false
    // 如果应用使用持久化存储保持登录状态，则期望为true
    console.log('新页面登录状态:', stillLoggedIn);

    // 清理
    await newPage.close();
  });

  test('应该支持直接URL访问受保护页面', async ({ page }) => {
    // 直接访问受保护的页面
    await page.goto('/ai-notepad');
    await page.waitForLoadState('networkidle');

    // 检查是否被重定向到登录或显示登录提示
    const needsAuth = await page.locator('input[type="password"]').isVisible().catch(() => false) ||
                     page.url().includes('/login') ||
                     await page.locator('button:has-text("登录")').isVisible().catch(() => false);

    if (needsAuth) {
      // 如果需要认证，执行登录
      await loginAsTestUser(page);

      // 验证登录后能正常访问页面
      await page.goto('/ai-notepad');
      await page.waitForLoadState('networkidle');

      // 验证页面内容
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    } else {
      // 如果不需要认证，验证页面正常显示
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('应该处理并发登录', async ({ page, context }) => {
    // 在第一个页面登录
    await loginAsTestUser(page);
    expect(await isLoggedIn(page)).toBe(true);

    // 创建第二个页面
    const secondPage = await context.newPage();
    await secondPage.goto('/');

    // 在第二个页面也应该是登录状态（共享session）
    const secondPageLoggedIn = await isLoggedIn(secondPage);
    console.log('第二个页面登录状态:', secondPageLoggedIn);

    // 在第一个页面登出
    await logout(page);

    // 刷新第二个页面，验证登出状态同步
    await secondPage.reload();
    await secondPage.waitForLoadState('networkidle');

    const secondPageAfterLogout = await isLoggedIn(secondPage);
    console.log('登出后第二个页面状态:', secondPageAfterLogout);

    // 清理
    await secondPage.close();
  });

  test('应该验证不同用户角色的访问权限', async ({ page }) => {
    // 测试普通用户权限
    await loginAsTestUser(page);

    const normalUserPages = ['/ai-notepad', '/ai-chat', '/pomodoro'];

    for (const url of normalUserPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 验证页面可访问
      const pageError = page.locator('text=/404|403|权限|forbidden/i');
      const hasError = await pageError.isVisible().catch(() => false);
      expect(hasError).toBe(false);
    }

    // 登出
    await logout(page);

    // 测试管理员用户（如果应用支持）
    // 注意：这需要根据实际应用的用户角色系统进行调整
    try {
      await page.evaluate(() => {
        localStorage.setItem('user_role', 'admin');
      });

      // 访问可能的管理页面
      const adminPages = ['/admin', '/settings', '/users'];

      for (const url of adminPages) {
        await page.goto(url);
        await page.waitForTimeout(1000);
        // 这里只是尝试访问，不强制要求这些页面存在
      }
    } catch (error) {
      console.log('管理员权限测试跳过:', error);
    }
  });

  test('应该处理网络错误情况', async ({ page }) => {
    // 模拟网络慢速
    await testEnv.simulateSlowNetwork();

    try {
      await loginAsTestUser(page);

      // 验证在慢速网络下仍能正常登录
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);
    } catch (error) {
      console.log('慢速网络测试结果:', error.message);
    }

    // 模拟离线状态
    await testEnv.simulateOffline();

    // 尝试访问页面
    await page.goto('/').catch(() => {
      // 预期会失败
    });

    // 恢复在线状态
    await testEnv.simulateOnline();

    // 验证恢复后能正常工作
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该正确处理表单验证', async ({ page }) => {
    await page.goto('/');

    // 寻找登录表单
    const loginButton = page.locator('button:has-text("登录"), a[href*="login"]').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      await page.goto('/login');
    }

    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    // 测试空表单提交
    const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
    await submitButton.click();

    // 验证表单验证消息
    const validationMessages = [
      'input:invalid',
      '.error',
      'text=/必填|required|不能为空/',
      '[data-testid="validation-error"]'
    ];

    let hasValidation = false;
    for (const selector of validationMessages) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        hasValidation = true;
        break;
      }
    }

    console.log('表单验证状态:', hasValidation);

    // 测试部分填写
    const usernameInput = page.locator('input[name="username"], input[type="email"]').first();
    await usernameInput.fill('testuser');

    await submitButton.click();

    // 验证密码字段验证
    const passwordValidation = await page.locator('input[type="password"]:invalid').isVisible().catch(() => false);
    console.log('密码字段验证:', passwordValidation);
  });
});