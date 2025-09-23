/**
 * 测试环境清理
 * 在测试结束后清理数据和状态
 */

import { test as cleanup, expect } from '@playwright/test';
import { TestDataManager } from '../../utils/test-data';
import { TestEnvironmentSetup } from '../../utils/test-env';

cleanup('cleanup test environment', async ({ page, context }) => {
  console.log('🧹 清理测试环境...');

  // 初始化清理工具
  const testDataManager = new TestDataManager(page, context.request);
  const testEnv = new TestEnvironmentSetup(page, context);

  try {
    // 清理测试数据
    console.log('🗑️ 清理测试数据...');
    await testDataManager.clearAllTestData();

    // 获取清理后的统计
    const stats = await testDataManager.getTestDataStats();
    console.log('📊 清理后数据统计:', stats);

    // 清理测试环境
    await testEnv.cleanup();

    console.log('✅ 测试环境清理完成');

  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error);
  }
});