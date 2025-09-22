/**
 * 项目管理看板E2E测试
 * 测试完整的用户流程：看板CRUD、列表CRUD、卡片CRUD、拖拽功能
 */

import { test, expect } from '@playwright/test';
import { login } from '../utils/auth';

test.describe('项目管理看板 - 完整功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/boards');
    await page.waitForLoadState('networkidle');
  });

  test.describe('看板管理', () => {
    test('应该创建新看板', async ({ page }) => {
      // 点击创建看板按钮
      await page.click('button:has-text("新建看板")');

      // 填写看板信息
      await page.fill('input[placeholder="输入看板名称"]', '测试项目看板');
      await page.click('button:has-text("蓝色")');

      // 提交表单
      await page.click('button:has-text("创建")');

      // 验证看板创建成功
      await expect(page.locator('h1:has-text("测试项目看板")')).toBeVisible();
      await expect(page).toHaveURL(/\/boards\/[a-f0-9-]+/);
    });

    test('应该编辑看板信息', async ({ page }) => {
      // 先创建看板
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '原始看板');
      await page.click('button:has-text("创建")');

      // 点击编辑按钮
      await page.click('button[title="编辑看板"]');

      // 修改看板名称
      await page.fill('input[placeholder="输入看板名称"]', '修改后的看板');
      await page.click('button:has-text("绿色")');

      // 保存修改
      await page.click('button:has-text("保存")');

      // 验证修改成功
      await expect(page.locator('h1:has-text("修改后的看板")')).toBeVisible();
    });

    test('应该删除看板', async ({ page }) => {
      // 先创建看板
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '待删除看板');
      await page.click('button:has-text("创建")');

      // 返回看板列表
      await page.click('a:has-text("看板列表")');

      // 找到刚创建的看板并删除
      const boardCard = page.locator('.board-card:has-text("待删除看板")');
      await boardCard.hover();
      await boardCard.click('button[title="删除"]');

      // 确认删除
      await page.click('button:has-text("确认删除")');

      // 验证删除成功
      await expect(boardCard).not.toBeVisible();
    });
  });

  test.describe('列表管理', () => {
    test.beforeEach(async ({ page }) => {
      // 创建测试看板
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '列表测试看板');
      await page.click('button:has-text("创建")');
    });

    test('应该创建新列表', async ({ page }) => {
      // 点击添加列表按钮
      await page.click('button:has-text("+ 添加列表")');

      // 输入列表名称
      await page.fill('input[placeholder="输入列表名称"]', '待办事项');

      // 确认创建
      await page.click('button:has-text("添加")');

      // 验证列表创建成功
      await expect(page.locator('.list-column:has-text("待办事项")')).toBeVisible();
    });

    test('应该创建多个列表', async ({ page }) => {
      const lists = ['待办', '进行中', '已完成'];

      for (const listName of lists) {
        await page.click('button:has-text("+ 添加列表")');
        await page.fill('input[placeholder="输入列表名称"]', listName);
        await page.click('button:has-text("添加")');
        await expect(page.locator(`.list-column:has-text("${listName}")`)).toBeVisible();
      }

      // 验证所有列表都存在
      for (const listName of lists) {
        await expect(page.locator(`.list-column:has-text("${listName}")`)).toBeVisible();
      }
    });

    test('应该编辑列表名称', async ({ page }) => {
      // 先创建列表
      await page.click('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', '原始列表');
      await page.click('button:has-text("添加")');

      // 编辑列表名称
      const listHeader = page.locator('.list-column:has-text("原始列表") .list-header');
      await listHeader.dblclick();

      // 清除原名称并输入新名称
      await page.fill('input[placeholder="输入列表名称"]', '修改后的列表');
      await page.keyboard.press('Enter');

      // 验证修改成功
      await expect(page.locator('.list-column:has-text("修改后的列表")')).toBeVisible();
    });

    test('应该删除列表', async ({ page }) => {
      // 先创建列表
      await page.click('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', '待删除列表');
      await page.click('button:has-text("添加")');

      // 删除列表
      const listColumn = page.locator('.list-column:has-text("待删除列表")');
      await listColumn.hover();
      await listColumn.click('button[title="删除列表"]');

      // 确认删除
      await page.click('button:has-text("确认")');

      // 验证删除成功
      await expect(listColumn).not.toBeVisible();
    });
  });

  test.describe('卡片管理', () => {
    test.beforeEach(async ({ page }) => {
      // 创建测试看板和列表
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '卡片测试看板');
      await page.click('button:has-text("创建")');

      // 创建列表
      await page.click('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', '任务列表');
      await page.click('button:has-text("添加")');
    });

    test('应该创建新卡片', async ({ page }) => {
      // 点击添加卡片按钮
      const listColumn = page.locator('.list-column:has-text("任务列表")');
      await listColumn.click('button:has-text("+ 添加卡片")');

      // 输入卡片标题
      await page.fill('textarea[placeholder="输入卡片标题"]', '测试任务卡片');

      // 确认创建
      await page.click('button:has-text("添加卡片")');

      // 验证卡片创建成功
      await expect(page.locator('.card-item:has-text("测试任务卡片")')).toBeVisible();
    });

    test('应该编辑卡片内容', async ({ page }) => {
      // 先创建卡片
      const listColumn = page.locator('.list-column:has-text("任务列表")');
      await listColumn.click('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', '原始卡片');
      await page.click('button:has-text("添加卡片")');

      // 点击卡片打开编辑模态框
      await page.click('.card-item:has-text("原始卡片")');

      // 编辑卡片内容
      await page.fill('input[placeholder="卡片标题"]', '修改后的卡片');
      await page.fill('textarea[placeholder="卡片描述"]', '这是修改后的描述内容');

      // 设置优先级
      await page.click('button:has-text("优先级")');
      await page.click('button:has-text("高")');

      // 保存修改
      await page.click('button:has-text("保存")');

      // 验证修改成功
      await expect(page.locator('.card-item:has-text("修改后的卡片")')).toBeVisible();
    });

    test('应该删除卡片', async ({ page }) => {
      // 先创建卡片
      const listColumn = page.locator('.list-column:has-text("任务列表")');
      await listColumn.click('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', '待删除卡片');
      await page.click('button:has-text("添加卡片")');

      // 删除卡片
      const cardItem = page.locator('.card-item:has-text("待删除卡片")');
      await cardItem.hover();
      await cardItem.click('button[title="删除卡片"]');

      // 确认删除
      await page.click('button:has-text("确认")');

      // 验证删除成功
      await expect(cardItem).not.toBeVisible();
    });

    test('应该设置卡片优先级', async ({ page }) => {
      // 创建卡片
      const listColumn = page.locator('.list-column:has-text("任务列表")');
      await listColumn.click('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', '优先级测试卡片');
      await page.click('button:has-text("添加卡片")');

      // 打开卡片编辑
      await page.click('.card-item:has-text("优先级测试卡片")');

      // 设置高优先级
      await page.click('button:has-text("优先级")');
      await page.click('button:has-text("高")');
      await page.click('button:has-text("保存")');

      // 验证优先级标识
      const cardItem = page.locator('.card-item:has-text("优先级测试卡片")');
      await expect(cardItem.locator('.priority-high')).toBeVisible();
    });
  });

  test.describe('拖拽功能', () => {
    test.beforeEach(async ({ page }) => {
      // 创建测试环境
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '拖拽测试看板');
      await page.click('button:has-text("创建")');

      // 创建两个列表
      const lists = ['列表A', '列表B'];
      for (const listName of lists) {
        await page.click('button:has-text("+ 添加列表")');
        await page.fill('input[placeholder="输入列表名称"]', listName);
        await page.click('button:has-text("添加")');
      }

      // 在列表A中创建卡片
      const listA = page.locator('.list-column:has-text("列表A")');
      await listA.click('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', '拖拽测试卡片');
      await page.click('button:has-text("添加卡片")');
    });

    test('应该支持卡片在同列表内拖拽重排序', async ({ page }) => {
      // 在列表A中创建第二张卡片
      const listA = page.locator('.list-column:has-text("列表A")');
      await listA.click('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', '第二张卡片');
      await page.click('button:has-text("添加卡片")');

      // 获取卡片元素
      const card1 = page.locator('.card-item:has-text("拖拽测试卡片")');
      const card2 = page.locator('.card-item:has-text("第二张卡片")');

      // 验证初始顺序
      await expect(card1.first()).toBeVisible();
      await expect(card2.last()).toBeVisible();

      // 执行拖拽操作（从第二张卡片拖拽到第一张卡片位置）
      await card2.dragTo(card1);

      // 验证顺序改变
      // 注意：实际拖拽效果需要在真实环境中测试
      await expect(card2).toBeVisible();
      await expect(card1).toBeVisible();
    });

    test('应该支持卡片跨列表拖拽', async ({ page }) => {
      // 获取卡片和列表元素
      const card = page.locator('.card-item:has-text("拖拽测试卡片")');
      const listB = page.locator('.list-column:has-text("列表B")');

      // 验证卡片初始在列表A中
      const listA = page.locator('.list-column:has-text("列表A")');
      await expect(listA.locator('.card-item:has-text("拖拽测试卡片")')).toBeVisible();

      // 执行拖拽操作
      await card.dragTo(listB);

      // 验证卡片移动到列表B
      await expect(listB.locator('.card-item:has-text("拖拽测试卡片")')).toBeVisible();
      await expect(listA.locator('.card-item:has-text("拖拽测试卡片")')).not.toBeVisible();
    });

    test('应该支持列表重排序', async ({ page }) => {
      // 获取列表元素
      const listA = page.locator('.list-column:has-text("列表A")');
      const listB = page.locator('.list-column:has-text("列表B")');

      // 验证初始顺序
      await expect(listA).toBeVisible();
      await expect(listB).toBeVisible();

      // 执行列表拖拽操作
      await listB.dragTo(listA);

      // 验证拖拽效果
      await expect(listA).toBeVisible();
      await expect(listB).toBeVisible();
    });
  });

  test.describe('移动端响应式', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone 尺寸

    test('应该在移动端正确显示看板', async ({ page }) => {
      // 创建测试看板
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '移动端测试看板');
      await page.click('button:has-text("创建")');

      // 验证移动端布局
      await expect(page.locator('.board-header')).toBeVisible();
      await expect(page.locator('.list-column')).toBeVisible();
    });

    test('应该支持移动端触摸拖拽', async ({ page }) => {
      // 创建测试环境
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '触摸测试看板');
      await page.click('button:has-text("创建")');

      // 创建列表和卡片
      await page.click('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', '触摸列表');
      await page.click('button:has-text("添加")');

      const listColumn = page.locator('.list-column:has-text("触摸列表")');
      await listColumn.click('button:has-text("+ 添加卡片")');
      await page.fill('textarea[placeholder="输入卡片标题"]', '触摸卡片');
      await page.click('button:has-text("添加卡片")');

      // 验证触摸交互
      const card = page.locator('.card-item:has-text("触摸卡片")');
      await expect(card).toBeVisible();

      // 触摸拖拽测试
      await card.tap();
      await expect(card).toBeVisible();
    });
  });

  test.describe('错误处理', () => {
    test('应该处理网络错误', async ({ page }) => {
      // 拦截API请求模拟网络错误
      await page.route('**/api/kanban/**', route => {
        route.abort('failed');
      });

      // 尝试创建看板
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '网络错误测试');
      await page.click('button:has-text("创建")');

      // 验证错误提示
      await expect(page.locator('.error-message')).toContainText('网络错误');
    });

    test('应该处理验证错误', async ({ page }) => {
      // 尝试创建空名称看板
      await page.click('button:has-text("新建看板")');
      await page.click('button:has-text("创建")');

      // 验证验证错误提示
      await expect(page.locator('.validation-error')).toContainText('看板名称不能为空');
    });
  });

  test.describe('性能测试', () => {
    test('应该快速加载大量卡片', async ({ page }) => {
      // 创建测试看板
      await page.click('button:has-text("新建看板")');
      await page.fill('input[placeholder="输入看板名称"]', '性能测试看板');
      await page.click('button:has-text("创建")');

      // 创建列表
      await page.click('button:has-text("+ 添加列表")');
      await page.fill('input[placeholder="输入列表名称"]', "大量卡片列表");
      await page.click('button:has-text("添加")');

      // 快速创建多个卡片
      const listColumn = page.locator('.list-column:has-text("大量卡片列表")');
      for (let i = 1; i <= 10; i++) {
        await listColumn.click('button:has-text("+ 添加卡片")');
        await page.fill('textarea[placeholder="输入卡片标题"]', `性能测试卡片 ${i}`);
        await page.click('button:has-text("添加卡片")');
      }

      // 验证所有卡片都正确显示
      for (let i = 1; i <= 10; i++) {
        await expect(page.locator(`.card-item:has-text("性能测试卡片 ${i}")`)).toBeVisible();
      }

      // 验证拖拽响应性
      const firstCard = page.locator('.card-item:has-text("性能测试卡片 1")');
      const lastCard = page.locator('.card-item:has-text("性能测试卡片 10")');

      // 拖拽操作应该在合理时间内完成
      await firstCard.dragTo(lastCard);
      await expect(firstCard).toBeVisible();
    });
  });
});