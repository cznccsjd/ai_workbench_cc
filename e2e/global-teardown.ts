/**
 * Playwright全局清理
 * 在所有测试结束后执行
 */

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始E2E测试环境清理...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 清理测试数据
    await cleanupTestData(page);

    // 生成测试报告摘要
    await generateTestSummary();

    console.log('✅ E2E测试环境清理完成');
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error);
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page: any) {
  console.log('🗑️ 清理测试数据...');

  try {
    // 尝试通过API清理测试数据
    try {
      const response = await page.request.delete('http://localhost:8000/api/test-data/cleanup');
      if (response.ok()) {
        console.log('✅ 通过API清理测试数据成功');
      }
    } catch (error) {
      console.log('ℹ️ API清理不可用，使用前端清理');
    }

    // 清理浏览器存储
    await page.evaluate(() => {
      // 只清理测试相关的数据
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('test-') || key.includes('e2e'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      sessionStorage.clear();
    });

    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.warn('⚠️ 测试数据清理部分失败:', error);
  }
}

async function generateTestSummary() {
  console.log('📊 生成测试报告摘要...');

  try {
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const resultsFile = path.join(testResultsDir, 'results.json');

    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));

      const summary = {
        timestamp: new Date().toISOString(),
        total: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        projects: results.stats?.projects || [],
        environment: {
          os: process.platform,
          node: process.version,
          ci: !!process.env.CI
        }
      };

      const summaryFile = path.join(testResultsDir, 'summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

      console.log('📈 测试统计:');
      console.log(`  ✅ 通过: ${summary.passed}`);
      console.log(`  ❌ 失败: ${summary.failed}`);
      console.log(`  ⏭️ 跳过: ${summary.skipped}`);
      console.log(`  ⏱️ 总计: ${summary.total}`);
      console.log(`  🕐 耗时: ${Math.round(summary.duration / 1000)}秒`);

      console.log(`✅ 测试报告摘要已保存: ${summaryFile}`);
    }
  } catch (error) {
    console.warn('⚠️ 生成测试报告摘要失败:', error);
  }
}

export default globalTeardown;