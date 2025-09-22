/**
 * 认证工具函数
 */

import { Page } from '@playwright/test';

/**
 * 用户登录
 */
export async function login(page: Page, username = 'testuser', password = 'password123') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

/**
 * 用户登出
 */
export async function logout(page: Page) {
  await page.click('button[title="用户菜单"]');
  await page.click('button:has-text("退出登录")');
  await page.waitForURL('/login');
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    await page.waitForURL('/dashboard', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}