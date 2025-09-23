import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../../utils/auth';

test.describe('主题切换功能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
  });

  test('应该显示主题切换器', async ({ page }) => {
    // 验证主题切换器存在
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');
    await expect(themeSwitcher).toBeVisible();

    // 验证当前主题显示
    const currentTheme = await themeSwitcher.textContent();
    expect(['🌙', '☀️', '🌓']).toContain(currentTheme);
  });

  test('应该切换亮色和暗色主题', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 获取初始主题
    const initialTheme = await themeSwitcher.textContent();

    // 点击切换主题
    await themeSwitcher.click();

    // 验证主题已切换
    const newTheme = await themeSwitcher.textContent();
    expect(newTheme).not.toBe(initialTheme);

    // 验证页面背景色变化
    const htmlElement = page.locator('html');
    if (newTheme === '🌙') {
      await expect(htmlElement).toHaveClass(/dark/);
    } else {
      await expect(htmlElement).not.toHaveClass(/dark/);
    }
  });

  test('应该循环切换所有主题模式', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 记录初始主题
    const initialTheme = await themeSwitcher.textContent();

    // 循环点击3次，应该回到初始主题
    for (let i = 0; i < 3; i++) {
      await themeSwitcher.click();
      await page.waitForTimeout(100); // 等待主题切换动画
    }

    // 验证回到初始主题
    const finalTheme = await themeSwitcher.textContent();
    expect(finalTheme).toBe(initialTheme);
  });

  test('应该记住用户的主题偏好', async ({ page, context }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 切换到暗色主题
    await themeSwitcher.click();

    // 等待主题设置保存
    await page.waitForTimeout(500);

    // 获取当前主题设置
    const selectedTheme = await themeSwitcher.textContent();

    // 重新打开页面
    await page.close();
    const newPage = await context.newPage();
    await loginAsTestUser(newPage);
    await newPage.goto('/');

    // 验证主题偏好被记住
    const newThemeSwitcher = newPage.locator('[data-testid="theme-switcher"]');
    await expect(newThemeSwitcher).toHaveText(selectedTheme!);
  });

  test('应该在所有页面应用主题设置', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 切换到暗色主题
    await themeSwitcher.click();

    // 导航到不同页面
    const pages = ['/ai-chat', '/pomodoro', '/ai-notepad'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      // 验证主题切换器仍然存在且主题一致
      const pageThemeSwitcher = page.locator('[data-testid="theme-switcher"]');
      await expect(pageThemeSwitcher).toBeVisible();
      await expect(pageThemeSwitcher).toHaveText('🌙');

      // 验证页面应用了暗色主题
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveClass(/dark/);
    }
  });

  test('应该正确应用CSS变量到所有组件', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 切换到暗色主题
    await themeSwitcher.click();

    // 验证CSS变量正确应用
    const rootElement = page.locator(':root');
    const backgroundColor = await rootElement.evaluate(el =>
      getComputedStyle(el).getPropertyValue('--background')
    );

    // 暗色主题应该有较暗的背景色
    expect(backgroundColor).toMatch(/rgb\(17, 24, 39\)/); // 对应于 slate-900
  });

  test('主题切换应该有平滑过渡效果', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');
    const htmlElement = page.locator('html');

    // 验证过渡效果存在
    const transitionProperty = await htmlElement.evaluate(el =>
      getComputedStyle(el).getPropertyValue('transition-property')
    );

    expect(transitionProperty).toContain('background-color');
    expect(transitionProperty).toContain('color');
  });

  test('应该在系统主题变化时自动适配', async ({ page, context }) => {
    // 模拟系统暗色主题
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      });
    });

    await page.reload();

    // 验证系统主题被应用
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test('主题切换不应该影响页面功能', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 多次切换主题
    for (let i = 0; i < 5; i++) {
      await themeSwitcher.click();
      await page.waitForTimeout(100);
    }

    // 验证页面功能仍然正常
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();

    // 验证链接仍然可点击
    const aiChatLink = page.locator('a[href="/ai-chat"]');
    await expect(aiChatLink).toBeVisible();
    await aiChatLink.click();

    // 验证页面导航成功
    await expect(page).toHaveURL(/\/ai-chat/);
  });

  test('应该正确处理主题切换错误', async ({ page }) => {
    const themeSwitcher = page.locator('[data-testid="theme-switcher"]');

    // 模拟localStorage错误
    await page.evaluate(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('localStorage error');
      };
      return originalSetItem;
    });

    // 尝试切换主题
    await themeSwitcher.click();

    // 验证主题仍然可以切换（即使保存失败）
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
  });
});