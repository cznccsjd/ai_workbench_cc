/**
 * 认证工具函数
 */

import { Page, expect } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  email?: string;
  role?: string;
}

export const DEFAULT_TEST_USER: TestUser = {
  username: 'testuser',
  password: 'password123',
  email: 'test@example.com',
  role: 'user'
};

export const ADMIN_TEST_USER: TestUser = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@example.com',
  role: 'admin'
};

/**
 * 用户登录
 */
export async function login(page: Page, user: TestUser = DEFAULT_TEST_USER) {
  await page.goto('/');

  // 检查是否已经登录
  if (await isLoggedIn(page)) {
    return;
  }

  // 寻找登录入口
  const loginButton = page.locator('button:has-text("登录"), a[href*="login"], button[data-testid="login-button"]').first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
  } else {
    await page.goto('/login');
  }

  // 等待登录表单加载
  await page.waitForSelector('input[name="username"], input[type="email"], input[placeholder*="用户名"], input[placeholder*="邮箱"]', { timeout: 5000 });

  // 填写登录信息
  const usernameInput = page.locator('input[name="username"], input[type="email"], input[placeholder*="用户名"], input[placeholder*="邮箱"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"], input[placeholder*="密码"]').first();

  await usernameInput.fill(user.username);
  await passwordInput.fill(user.password);

  // 提交登录表单
  const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button[data-testid="login-submit"]').first();
  await submitButton.click();

  // 等待登录成功，可能跳转到首页或仪表板
  await page.waitForLoadState('networkidle');

  // 验证登录成功 - 等待页面跳转或检查登录状态
  try {
    await page.waitForURL(url => !url.includes('/login'), { timeout: 5000 });
  } catch {
    // 如果没有跳转，检查是否出现了登录成功的标识
    const loggedInIndicator = page.locator('[data-testid="user-menu"], .user-avatar, button:has-text("退出")').first();
    await expect(loggedInIndicator).toBeVisible({ timeout: 5000 });
  }
}

/**
 * 使用默认测试用户登录
 */
export async function loginAsTestUser(page: Page) {
  await login(page, DEFAULT_TEST_USER);
}

/**
 * 使用管理员用户登录
 */
export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN_TEST_USER);
}

/**
 * 用户注册
 */
export async function register(page: Page, user: TestUser) {
  await page.goto('/');

  // 寻找注册入口
  const registerButton = page.locator('button:has-text("注册"), a[href*="register"], button[data-testid="register-button"]').first();
  if (await registerButton.isVisible()) {
    await registerButton.click();
  } else {
    await page.goto('/register');
  }

  // 等待注册表单加载
  await page.waitForSelector('input[name="username"], input[placeholder*="用户名"]', { timeout: 5000 });

  // 填写注册信息
  await page.fill('input[name="username"], input[placeholder*="用户名"]', user.username);
  if (user.email) {
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="邮箱"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(user.email);
    }
  }
  await page.fill('input[name="password"], input[type="password"], input[placeholder*="密码"]', user.password);

  // 如果有确认密码字段
  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="confirm-password"], input[placeholder*="确认密码"]');
  if (await confirmPasswordInput.isVisible()) {
    await confirmPasswordInput.fill(user.password);
  }

  // 提交注册表单
  const submitButton = page.locator('button[type="submit"], button:has-text("注册"), button[data-testid="register-submit"]').first();
  await submitButton.click();

  // 等待注册成功
  await page.waitForLoadState('networkidle');
}

/**
 * 用户登出
 */
export async function logout(page: Page) {
  // 寻找用户菜单
  const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button[title*="用户菜单"], .dropdown-trigger').first();

  if (await userMenu.isVisible()) {
    await userMenu.click();

    // 等待菜单展开
    await page.waitForTimeout(300);

    // 点击登出按钮
    const logoutButton = page.locator('button:has-text("退出"), button:has-text("登出"), a[href*="logout"], [data-testid="logout-button"]').first();
    await logoutButton.click();
  } else {
    // 如果没有用户菜单，寻找直接的登出按钮
    const directLogoutButton = page.locator('button:has-text("退出登录"), button:has-text("登出")').first();
    if (await directLogoutButton.isVisible()) {
      await directLogoutButton.click();
    }
  }

  // 等待登出完成
  await page.waitForLoadState('networkidle');

  // 验证登出成功 - 应该回到登录页面或首页
  await page.waitForTimeout(1000);
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // 检查是否存在登录用户的标识
    const loggedInIndicators = [
      '[data-testid="user-menu"]',
      '.user-avatar',
      'button:has-text("退出")',
      'button[title*="用户菜单"]',
      '[data-testid="logout-button"]'
    ];

    for (const selector of loggedInIndicators) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        return true;
      }
    }

    // 检查是否在受保护的页面上
    const url = page.url();
    if (url.includes('/dashboard') || url.includes('/profile') || url.includes('/ai-')) {
      // 如果在受保护页面但没有登录标识，可能是加载问题
      await page.waitForTimeout(2000);

      // 再次检查登录标识
      for (const selector of loggedInIndicators) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * 等待用户认证状态加载完成
 */
export async function waitForAuthState(page: Page, timeout: number = 5000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // 检查是否存在加载指示器
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner');
    const isLoading = await loadingIndicators.first().isVisible().catch(() => false);

    if (!isLoading) {
      // 检查认证状态
      const isAuthenticated = await isLoggedIn(page);
      const hasLoginForm = await page.locator('input[type="password"]').isVisible().catch(() => false);

      if (isAuthenticated || hasLoginForm) {
        return;
      }
    }

    await page.waitForTimeout(200);
  }
}

/**
 * 清除认证状态（清除localStorage, sessionStorage, cookies）
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.context().clearCookies();
}

/**
 * 设置认证令牌（用于直接设置登录状态）
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
    localStorage.setItem('access_token', t);
  }, token);
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
}