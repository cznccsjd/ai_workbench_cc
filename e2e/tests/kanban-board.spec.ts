/**
 * 项目管理看板E2E测试
 * 测试核心功能：看板CRUD、列表CRUD、卡片CRUD、拖拽功能
 */

import { test, expect } from '@playwright/test';

test.describe('项目管理看板功能测试', () => {
  // 测试前置条件：用户登录
  test.beforeEach(async ({ page }) => {
    // 假设用户已经登录，直接访问看板页面
    await page.goto('http://localhost:3000/boards');
    await page.waitForLoadState('networkidle');
  });

  test('应该显示看板列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/项目管理看板/);

    // 验证看板列表容器存在
    await expect(page.locator('[data-testid="board-list-container"]')).toBeVisible();

    // 验证创建看板按钮存在
    await expect(page.locator('button:has-text("创建看板")')).toBeVisible();
  });

  test('应该创建新看板', async ({ page }) => {
    // 点击创建看板按钮
    await page.click('button:has-text("创建看板")');

    // 等待模态框出现
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 输入看板名称
    await page.fill('input[placeholder="请输入看板名称"]', '测试看板');

    // 输入看板描述
    await page.fill('textarea[placeholder="请输入看板描述（可选）"]', '这是一个测试看板');

    // 选择背景色
    await page.click('[data-testid="color-blue"]');

    // 点击创建按钮
    await page.click('button:has-text("创建")');

    // 等待创建完成并重定向
    await page.waitForURL('**/boards/**');

    // 验证看板标题显示
    await expect(page.locator('h1')).toContainText('测试看板');
  });

  test('应该创建新列表', async ({ page }) => {
    // 先创建一个看板
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '列表测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    // 点击添加列表按钮
    await page.click('button:has-text("添加列表")');

    // 输入列表名称
    await page.fill('input[placeholder="请输入列表名称"]', '待办事项');

    // 点击确认按钮
    await page.click('button:has-text("添加")');

    // 验证列表创建成功
    await expect(page.locator('h3:has-text("待办事项")')).toBeVisible();
  });

  test('应该创建新卡片', async ({ page }) => {
    // 先创建看板和列表
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '卡片测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    await page.click('button:has-text("添加列表")');
    await page.fill('input[placeholder="请输入列表名称"]', '任务列表');
    await page.click('button:has-text("添加")');

    // 等待列表创建完成
    await expect(page.locator('h3:has-text("任务列表")')).toBeVisible();

    // 点击添加卡片按钮
    await page.click('button:has-text("添加卡片")');

    // 输入卡片标题
    await page.fill('input[placeholder="请输入卡片标题"]', '测试任务');

    // 输入卡片描述
    await page.fill('textarea[placeholder="请输入卡片描述"]', '这是一个测试任务');

    // 选择优先级
    await page.selectOption('select[name="priority"]', 'medium');

    // 点击创建按钮
    await page.click('button:has-text("创建")');

    // 验证卡片创建成功
    await expect(page.locator('.kanban-card:has-text("测试任务")')).toBeVisible();
  });

  test('应该支持卡片拖拽功能', async ({ page }) => {
    // 创建测试数据
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '拖拽测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    // 创建两个列表
    await page.click('button:has-text("添加列表")');
    await page.fill('input[placeholder="请输入列表名称"]', '待办');
    await page.click('button:has-text("添加")');

    await page.click('button:has-text("添加列表")');
    await page.fill('input[placeholder="请输入列表名称"]', '进行中');
    await page.click('button:has-text("添加")');

    // 在第一个列表中创建卡片
    const firstList = page.locator('.kanban-list').first();
    await firstList.locator('button:has-text("添加卡片")').click();
    await page.fill('input[placeholder="请输入卡片标题"]', '可拖拽卡片');
    await page.click('button:has-text("创建")');

    // 等待卡片创建
    const card = page.locator('.kanban-card:has-text("可拖拽卡片")');
    await card.waitFor();

    // 获取目标列表位置
    const targetList = page.locator('.kanban-list').nth(1);
    const targetListBox = await targetList.boundingBox();

    // 执行拖拽操作
    await card.dragTo(targetList, {
      targetPosition: { x: targetListBox!.width / 2, y: 100 }
    });

    // 验证卡片移动成功
    await expect(targetList.locator('.kanban-card:has-text("可拖拽卡片")')).toBeVisible();
  });

  test('应该支持列表重排序', async ({ page }) => {
    // 创建测试数据
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '重排序测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    // 创建三个列表
    const listNames = ['列表A', '列表B', '列表C'];
    for (const name of listNames) {
      await page.click('button:has-text("添加列表")');
      await page.fill('input[placeholder="请输入列表名称"]', name);
      await page.click('button:has-text("添加")');
    }

    // 等待所有列表创建完成
    for (const name of listNames) {
      await expect(page.locator(`h3:has-text("${name}")`)).toBeVisible();
    }

    // 获取第一个和最后一个列表
    const firstList = page.locator('.kanban-list').first();
    const lastList = page.locator('.kanban-list').last();

    // 将第一个列表拖拽到最后
    await firstList.dragTo(lastList, {
      targetPosition: { x: 0, y: 50 }
    });

    // 验证重排序成功（第一个列表现在应该是"列表B"）
    const newFirstList = page.locator('.kanban-list').first();
    await expect(newFirstList.locator('h3:has-text("列表B")')).toBeVisible();
  });

  test('应该支持移动端触摸操作', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    // 创建测试数据
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '移动端测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    await page.click('button:has-text("添加列表")');
    await page.fill('input[placeholder="请输入列表名称"]', '移动端列表');
    await page.click('button:has-text("添加")');

    await page.click('button:has-text("添加卡片")');
    await page.fill('input[placeholder="请输入卡片标题"]', '移动端卡片');
    await page.click('button:has-text("创建")');

    // 验证移动端触摸优化样式
    const card = page.locator('.kanban-card:has-text("移动端卡片")');
    await expect(card).toBeVisible();

    // 验证触摸目标大小适合移动设备
    const cardBox = await card.boundingBox();
    expect(cardBox!.height).toBeGreaterThanOrEqual(44); // 最小触摸目标高度
    expect(cardBox!.width).toBeGreaterThanOrEqual(44);  // 最小触摸目标宽度
  });

  test('应该处理错误状态', async ({ page }) => {
    // 尝试访问不存在的看板
    await page.goto('http://localhost:3000/boards/invalid-board-id');

    // 验证错误消息显示
    await expect(page.locator('text=看板不存在')).toBeVisible();
  });

  test('应该支持卡片编辑和删除', async ({ page }) => {
    // 创建测试数据
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '编辑测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    await page.click('button:has-text("添加列表")');
    await page.fill('input[placeholder="请输入列表名称"]', '编辑列表');
    await page.click('button:has-text("添加")');

    await page.click('button:has-text("添加卡片")');
    await page.fill('input[placeholder="请输入卡片标题"]', '待编辑卡片');
    await page.click('button:has-text("创建")');

    // 点击卡片打开编辑模态框
    await page.click('.kanban-card:has-text("待编辑卡片")');

    // 等待模态框出现
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 编辑卡片标题
    await page.fill('input[name="title"]', '已编辑卡片');

    // 点击保存
    await page.click('button:has-text("保存")');

    // 验证编辑成功
    await expect(page.locator('.kanban-card:has-text("已编辑卡片")')).toBeVisible();

    // 再次点击卡片打开模态框
    await page.click('.kanban-card:has-text("已编辑卡片")');

    // 点击删除按钮
    await page.click('button:has-text("删除")');

    // 确认删除
    await page.click('button:has-text("确认")');

    // 验证删除成功
    await expect(page.locator('.kanban-card:has-text("已编辑卡片")')).not.toBeVisible();
  });

  test('应该支持响应式设计', async ({ page }) => {
    // 测试桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.click('button:has-text("创建看板")');
    await page.fill('input[placeholder="请输入看板名称"]', '响应式测试看板');
    await page.click('button:has-text("创建")');
    await page.waitForURL('**/boards/**');

    // 验证桌面端布局
    const boardContainer = page.locator('.kanban-board-container');
    await expect(boardContainer).toBeVisible();

    // 测试平板端
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(boardContainer).toBeVisible();

    // 测试移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(boardContainer).toBeVisible();

    // 验证移动端菜单按钮存在
    await expect(page.locator('button[data-testid="mobile-menu"]')).toBeVisible();
  });
});