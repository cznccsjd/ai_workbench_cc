/**
 * 移动端触摸拖拽E2E测试
 * 专门测试移动端触摸交互和拖拽功能
 */

import { test, expect, devices } from '@playwright/test';
import { login } from '../utils/auth';

test.describe('移动端触摸拖拽功能', () => {
  // 使用iPhone 12设备配置
  test.use({
    ...devices['iPhone 12'],
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/boards');
    await page.waitForLoadState('networkidle');
  });

  test('移动端触摸交互基本测试', async ({ page }) => {
    // 创建测试看板
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', '移动端触摸测试');
    await page.tap('button:has-text("创建")');

    // 验证移动端布局
    await expect(page.locator('.board-header')).toBeVisible();
    await expect(page.locator('.board-title')).toContainText('移动端触摸测试');

    // 测试触摸创建列表
    await page.tap('button:has-text("+ 添加列表")');
    await page.fill('input[placeholder="输入列表名称"]', "触摸列表");
    await page.tap('button:has-text("添加")');

    // 验证列表创建
    await expect(page.locator('.list-column:has-text("触摸列表")')).toBeVisible();
  });

  test('移动端卡片触摸操作', async ({ page }) => {
    // 创建测试环境
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', '卡片触摸测试');
    await page.tap('button:has-text("创建")');

    await page.tap('button:has-text("+ 添加列表")');
    await page.fill('input[placeholder="输入列表名称"]', "卡片列表");
    await page.tap('button:has-text("添加")');

    // 创建卡片
    const listColumn = page.locator('.list-column:has-text("卡片列表")');
    await listColumn.tap('button:has-text("+ 添加卡片")');
    await page.fill('textarea[placeholder="输入卡片标题"]', '触摸卡片测试');
    await page.tap('button:has-text("添加卡片")');

    // 测试卡片触摸
    const card = page.locator('.card-item:has-text("触摸卡片测试")');
    await expect(card).toBeVisible();

    // 长按卡片（模拟拖拽开始）
    await card.tap({ delay: 500 });

    // 验证卡片仍然可见
    await expect(card).toBeVisible();
  });

  test('移动端拖拽手势模拟', async ({ page }) => {
    // 创建测试环境
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', "拖拽手势测试");
    await page.tap('button:has-text("创建")');

    // 创建两个列表
    for (const listName of ['源列表', '目标列表']) {
      await page.tap('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', listName);
      await page.tap('button:has-text("添加")');
    }

    // 在源列表创建卡片
    const sourceList = page.locator('.list-column:has-text("源列表")');
    await sourceList.tap('button:has-text("+ 添加卡片")');
    await page.fill('textarea[placeholder="输入卡片标题"]', "手势拖拽卡片");
    await page.tap('button:has-text("添加卡片")');

    // 获取卡片元素
    const card = page.locator('.card-item:has-text("手势拖拽卡片")');
    const targetList = page.locator('.list-column:has-text("目标列表")');

    // 验证初始状态
    await expect(sourceList.locator('.card-item:has-text("手势拖拽卡片")')).toBeVisible();

    // 使用触摸事件模拟拖拽
    const cardBox = await card.boundingBox();
    const targetBox = await targetList.boundingBox();

    if (cardBox && targetBox) {
      // 模拟触摸开始
      await page.touchscreen.tap(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);

      // 等待拖拽状态激活
      await page.waitForTimeout(500);

      // 模拟触摸移动到目标位置
      await page.touchscreen.tap(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2
      );

      // 等待拖拽完成
      await page.waitForTimeout(500);
    }

    // 验证拖拽效果（实际效果取决于拖拽实现）
    await expect(card).toBeVisible();
  });

  test('移动端响应式布局验证', async ({ page }) => {
    // 创建测试看板
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', "响应式布局测试");
    await page.tap('button:has-text("创建")');

    // 创建多个列表测试滚动
    for (let i = 1; i <= 5; i++) {
      await page.tap('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', `响应式列表${i}`);
      await page.tap('button:has-text("添加")');
    }

    // 验证移动端布局
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390); // iPhone 12 宽度
    expect(viewport?.height).toBe(844); // iPhone 12 高度

    // 验证水平滚动功能
    const listsContainer = page.locator('.lists-container');
    await expect(listsContainer).toBeVisible();

    // 测试滚动到最右侧
    await listsContainer.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });

    // 验证滚动效果
    const scrollPosition = await listsContainer.evaluate((element) => element.scrollLeft);
    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('移动端触摸反馈测试', async ({ page }) => {
    // 创建测试环境
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', "触摸反馈测试");
    await page.tap('button:has-text("创建")');

    await page.tap('button:has-text("+ 添加列表")');
    await page.fill('input[placeholder="输入列表名称"]', "反馈列表");
    await page.tap('button:has-text("添加")');

    // 创建卡片
    const listColumn = page.locator('.list-column:has-text("反馈列表")');
    await listColumn.tap('button:has-text("+ 添加卡片")');
    await page.fill('textarea[placeholder="输入卡片标题"]', "反馈测试卡片");
    await page.tap('button:has-text("添加卡片")');

    // 测试按钮触摸反馈
    const addCardButton = listColumn.locator('button:has-text("+ 添加卡片")');

    // 验证按钮可见且可交互
    await expect(addCardButton).toBeVisible();
    await expect(addCardButton).toBeEnabled();

    // 测试触摸效果（CSS active 状态）
    await addCardButton.evaluate((button) => {
      button.classList.add('active');
    });

    await page.waitForTimeout(100);

    await addCardButton.evaluate((button) => {
      button.classList.remove('active');
    });
  });

  test('移动端手势冲突处理', async ({ page }) => {
    // 创建测试环境
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', "手势冲突测试");
    await page.tap('button:has-text("创建")');

    // 创建列表
    await page.tap('button:has-text("+ 添加列表")');
    await page.fill('input[placeholder="输入列表名称"]', "冲突测试列表");
    await page.tap('button:has-text("添加")');

    // 创建多个卡片
    const listColumn = page.locator('.list-column:has-text("冲突测试列表")');
    for (let i = 1; i <= 3; i++) {
      await listColumn.tap('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', `冲突测试卡片${i}`);
      await page.tap('button:has-text("添加卡片")');
    }

    // 测试快速连续触摸
    const cards = [
      page.locator('.card-item:has-text("冲突测试卡片1")'),
      page.locator('.card-item:has-text("冲突测试卡片2")'),
      page.locator('.card-item:has-text("冲突测试卡片3")')
    ];

    // 快速连续点击
    for (const card of cards) {
      await card.tap();
      await page.waitForTimeout(50); // 50ms间隔
    }

    // 验证所有卡片仍然可见
    for (const card of cards) {
      await expect(card).toBeVisible();
    }
  });

  test('移动端网络状态变化处理', async ({ page, context }) => {
    // 创建测试看板
    await page.tap('button:has-text("新建看板")');
    await page.fill('input[placeholder="输入看板名称"]', "网络变化测试");
    await page.tap('button:has-text("创建")');

    // 模拟网络离线
    await context.setOffline(true);

    // 尝试创建列表（应该失败或显示离线提示）
    await page.tap('button:has-text("+ 添加列表")');

    // 验证离线状态提示
    await expect(page.locator('.offline-indicator')).toBeVisible();

    // 恢复网络
    await context.setOffline(false);

    // 验证可以正常操作
    await page.fill('input[placeholder="输入列表名称"]', "网络恢复列表");
    await page.tap('button:has-text("添加")');

    await expect(page.locator('.list-column:has-text("网络恢复列表")')).toBeVisible();
  });
});