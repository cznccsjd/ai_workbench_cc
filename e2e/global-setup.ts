/**
 * Playwright全局设置
 * 在所有测试开始前执行
 */

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始E2E测试环境初始化...');

  // 创建测试结果目录
  const testResultsDir = path.join(process.cwd(), 'test-results');
  const screenshotsDir = path.join(testResultsDir, 'screenshots');

  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 等待服务启动
  console.log('⏳ 等待前后端服务启动...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 等待前端服务
  await waitForService(page, 'http://localhost:3000', '前端服务');

  // 等待后端服务（可选）
  try {
    await waitForService(page, 'http://localhost:8000/health', '后端服务');
  } catch (error) {
    console.warn('⚠️ 后端服务未启动，将使用模拟数据进行测试');
  }

  // 初始化测试数据
  await initializeTestData(page);

  await browser.close();

  console.log('✅ E2E测试环境初始化完成');
}

async function waitForService(page: any, url: string, serviceName: string, maxRetries = 30) {
  console.log(`🔄 等待${serviceName}启动: ${url}`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await page.request.get(url);
      if (response.ok()) {
        console.log(`✅ ${serviceName}已启动`);
        return;
      }
    } catch (error) {
      // 继续重试
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`⏳ 重试中... (${i + 1}/${maxRetries})`);
  }

  throw new Error(`❌ ${serviceName}启动失败: ${url}`);
}

async function initializeTestData(page: any) {
  console.log('📝 初始化测试数据...');

  try {
    // 清理可能存在的测试数据
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 设置测试模式标识
    await page.evaluate(() => {
      localStorage.setItem('test-mode', 'true');
      localStorage.setItem('e2e-test-session', Date.now().toString());
    });

    console.log('✅ 测试数据初始化完成');
  } catch (error) {
    console.warn('⚠️ 测试数据初始化失败:', error);
  }
}

export default globalSetup;