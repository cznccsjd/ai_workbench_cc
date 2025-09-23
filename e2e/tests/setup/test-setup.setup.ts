/**
 * 测试环境设置
 * 在测试开始前准备环境和数据
 */

import { test as setup, expect } from '@playwright/test';
import { TestDataManager, TEST_DATA_SETS } from '../../utils/test-data';
import { TestEnvironmentSetup } from '../../utils/test-env';

const authFile = 'test-results/.auth/user.json';

setup('prepare test environment', async ({ page, context }) => {
  console.log('🔧 准备测试环境...');

  // 初始化测试环境
  const testEnv = new TestEnvironmentSetup(page, context);
  await testEnv.setup();

  // 初始化测试数据管理器
  const testDataManager = new TestDataManager(page, context.request);

  // 清理可能存在的旧数据
  await testDataManager.clearAllTestData();

  // 创建基础测试数据
  console.log('📝 创建测试数据...');

  try {
    // 创建测试笔记
    await testDataManager.createMultipleTestNotes(3);
    console.log('✅ AI记事本测试数据创建完成');

    // 创建测试看板
    await testDataManager.createTestKanbanBoard(TEST_DATA_SETS.SAMPLE_KANBAN_BOARD);
    console.log('✅ 看板测试数据创建完成');

    // 创建测试聊天会话
    await testDataManager.createTestChatSession(TEST_DATA_SETS.SAMPLE_CHAT_MESSAGES);
    console.log('✅ AI对话测试数据创建完成');

  } catch (error) {
    console.warn('⚠️ 部分测试数据创建失败:', error);
  }

  // 设置认证状态（如果需要）
  await setupAuthState(page);

  console.log('✅ 测试环境准备完成');
});

async function setupAuthState(page: any) {
  console.log('🔐 设置认证状态...');

  try {
    // 访问首页
    await page.goto('/');

    // 检查是否需要登录
    const needsAuth = await page.locator('input[type="password"]').isVisible().catch(() => false);

    if (needsAuth) {
      // 执行登录流程
      const usernameInput = page.locator('input[name="username"], input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
        await usernameInput.fill('testuser');
        await passwordInput.fill('password123');

        const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
        await submitButton.click();

        await page.waitForLoadState('networkidle');
      }
    }

    // 保存认证状态
    await page.context().storageState({ path: authFile });
    console.log('✅ 认证状态已保存');

  } catch (error) {
    console.warn('⚠️ 认证设置失败，测试将在无认证状态下运行:', error);
  }
}