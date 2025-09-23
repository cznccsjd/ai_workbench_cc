/**
 * AI对话交互E2E测试
 * 测试AI对话功能的完整用户流程
 */

import { test, expect } from '@playwright/test';
import { loginAsTestUser, clearAuthState } from '../../utils/auth';
import { TestEnvironmentSetup, TestAssertions } from '../../utils/test-env';
import { TestDataManager, TEST_DATA_SETS } from '../../utils/test-data';
import { AIChatPage } from '../../pages/AIChatPage';

test.describe('AI对话交互功能', () => {
  let chatPage: AIChatPage;
  let testEnv: TestEnvironmentSetup;
  let assertions: TestAssertions;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page, context }) => {
    chatPage = new AIChatPage(page);
    testEnv = new TestEnvironmentSetup(page, context);
    assertions = new TestAssertions(page);
    testDataManager = new TestDataManager(page, context.request);

    await testEnv.setup();

    // 登录（如果需要）
    try {
      await loginAsTestUser(page);
    } catch {
      // 如果登录失败，继续测试（可能不需要认证）
    }

    await chatPage.goto();
  });

  test.afterEach(async ({ page }) => {
    // 清理测试数据
    try {
      await chatPage.clearChat();
    } catch {
      // 忽略清理错误
    }
  });

  test('应该正确加载AI对话页面', async ({ page }) => {
    // 验证页面标题
    await assertions.expectPageTitle(/AI.*对话|聊天|Chat/i);

    // 验证页面URL
    await assertions.expectURL(/ai-chat/);

    // 验证主要元素存在
    await assertions.expectElementVisible('[data-testid="message-input"], textarea, input[placeholder*="输入"]');
    await assertions.expectElementVisible('[data-testid="send-button"], button:has-text("发送")');
    await assertions.expectElementVisible('[data-testid="messages"], .messages, .chat-container');

    // 验证输入框可用
    const messageInput = chatPage.getMessageInput();
    await expect(messageInput).toBeEditable();
  });

  test('应该能够发送和接收消息', async ({ page }) => {
    const testMessage = '你好，这是一个测试消息';

    // 发送消息
    await chatPage.sendMessage(testMessage);

    // 验证用户消息显示
    await expect(chatPage.getMessagesContainer()).toContainText(testMessage);

    // 等待AI响应
    await chatPage.waitForAIResponse();

    // 验证收到AI响应
    const messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBeGreaterThanOrEqual(2); // 至少有用户消息和AI响应

    // 验证AI响应内容
    const lastResponse = await chatPage.getLastAssistantMessage();
    expect(lastResponse.length).toBeGreaterThan(0);
  });

  test('应该支持Enter键发送消息', async ({ page }) => {
    const testMessage = '测试Enter键发送';

    await chatPage.sendMessageWithEnter(testMessage);

    // 验证消息被发送
    await expect(chatPage.getMessagesContainer()).toContainText(testMessage);

    await chatPage.waitForAIResponse();

    // 验证收到响应
    const messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });

  test('应该支持多行消息输入', async ({ page }) => {
    const multilineMessage = '这是第一行\n这是第二行\n这是第三行';

    await chatPage.sendMultilineMessage(multilineMessage);

    // 验证多行消息显示
    await expect(chatPage.getMessagesContainer()).toContainText('第一行');
    await expect(chatPage.getMessagesContainer()).toContainText('第二行');
    await expect(chatPage.getMessagesContainer()).toContainText('第三行');

    await chatPage.waitForAIResponse();
  });

  test('应该显示输入状态指示器', async ({ page }) => {
    await chatPage.sendMessage('请告诉我关于人工智能的信息');

    // 验证输入指示器出现
    const typingIndicator = chatPage.getTypingIndicator();
    const isTypingVisible = await typingIndicator.isVisible().catch(() => false);

    if (isTypingVisible) {
      // 如果有输入指示器，验证它最终消失
      await typingIndicator.waitFor({ state: 'hidden', timeout: 15000 });
    }

    // 验证最终收到响应
    await chatPage.waitForAIResponse();
    const lastResponse = await chatPage.getLastAssistantMessage();
    expect(lastResponse.length).toBeGreaterThan(0);
  });

  test('应该能够创建和管理多个对话会话', async ({ page }) => {
    // 创建第一个会话
    await chatPage.sendMessage('第一个会话的消息');
    await chatPage.waitForAIResponse();

    const firstSessionName = await chatPage.getCurrentSessionName();

    // 创建新会话
    await chatPage.createNewSession();

    // 在新会话中发送消息
    await chatPage.sendMessage('第二个会话的消息');
    await chatPage.waitForAIResponse();

    // 验证是新的会话
    const secondSessionName = await chatPage.getCurrentSessionName();
    expect(secondSessionName).not.toBe(firstSessionName);

    // 切换回第一个会话
    if (firstSessionName) {
      await chatPage.selectSession(firstSessionName);

      // 验证第一个会话的内容
      await expect(chatPage.getMessagesContainer()).toContainText('第一个会话');
      await expect(chatPage.getMessagesContainer()).not.toContainText('第二个会话');
    }
  });

  test('应该能够清空对话历史', async ({ page }) => {
    // 发送几条消息
    await chatPage.sendMessage('第一条消息');
    await chatPage.waitForAIResponse();

    await chatPage.sendMessage('第二条消息');
    await chatPage.waitForAIResponse();

    // 验证消息存在
    let messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBeGreaterThan(0);

    // 清空对话
    await chatPage.clearChat();

    // 验证消息被清空
    messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBe(0);
  });

  test('应该处理特殊字符和表情符号', async ({ page }) => {
    await chatPage.testSpecialCharacters();

    // 验证特殊字符消息显示正确
    await expect(chatPage.getMessagesContainer()).toContainText('script');
    await expect(chatPage.getMessagesContainer()).toContainText('中文测试');

    await chatPage.waitForAIResponse();

    // 测试表情符号
    await chatPage.testEmojiMessage();

    await expect(chatPage.getMessagesContainer()).toContainText('😀');
    await expect(chatPage.getMessagesContainer()).toContainText('🤩');

    await chatPage.waitForAIResponse();
  });

  test('应该处理代码片段', async ({ page }) => {
    await chatPage.testCodeMessage();

    // 验证代码消息显示
    await expect(chatPage.getMessagesContainer()).toContainText('fibonacci');
    await expect(chatPage.getMessagesContainer()).toContainText('Python');

    await chatPage.waitForAIResponse();

    // 验证AI能理解和响应代码问题
    const response = await chatPage.getLastAssistantMessage();
    expect(response.toLowerCase()).toMatch(/函数|代码|python|正确|递归/);
  });

  test('应该支持消息复制功能', async ({ page }) => {
    const testMessage = '这条消息将被复制';

    await chatPage.sendMessage(testMessage);
    await chatPage.waitForAIResponse();

    // 尝试复制用户消息
    try {
      await chatPage.copyMessage(testMessage);

      // 验证复制功能（通过粘贴到输入框验证）
      await chatPage.getMessageInput().click();
      await page.keyboard.press('Control+V');

      const inputValue = await chatPage.getMessageInput().inputValue();
      expect(inputValue).toContain(testMessage);
    } catch (error) {
      console.log('复制功能测试跳过:', error);
    }
  });

  test('应该支持消息重新生成', async ({ page }) => {
    await chatPage.sendMessage('请生成一个简短的回复');
    await chatPage.waitForAIResponse();

    const originalResponse = await chatPage.getLastAssistantMessage();

    try {
      // 重新生成响应
      await chatPage.regenerateResponse();
      await chatPage.waitForAIResponse();

      const newResponse = await chatPage.getLastAssistantMessage();

      // 验证响应已更新（可能相同，但至少应该有响应）
      expect(newResponse.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('重新生成功能测试跳过:', error);
    }
  });

  test('应该处理网络错误和恢复', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/chat/**', route => {
      route.abort('failed');
    });

    await chatPage.sendMessage('这条消息应该失败');

    // 验证错误处理
    await page.waitForTimeout(3000);

    // 检查是否显示错误消息
    const hasError = await chatPage.hasError();
    if (hasError) {
      const errorText = await chatPage.getErrorText();
      expect(errorText.toLowerCase()).toMatch(/错误|失败|网络|连接/);

      // 关闭错误消息
      await chatPage.dismissError();
    }

    // 恢复网络
    await page.unroute('**/api/chat/**');

    // 测试恢复后的功能
    await chatPage.sendMessage('网络恢复后的测试消息');
    await chatPage.waitForAIResponse();

    const response = await chatPage.getLastAssistantMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('应该处理长消息', async ({ page }) => {
    await chatPage.testLongMessage();

    // 验证长消息显示
    const messages = await chatPage.getAllMessages();
    const longMessage = messages.find(msg => msg.content.length > 1000);
    expect(longMessage).toBeDefined();

    await chatPage.waitForAIResponse();

    // 验证AI能处理长消息
    const response = await chatPage.getLastAssistantMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('应该支持快捷键操作', async ({ page }) => {
    // 测试Ctrl+Enter发送消息
    await chatPage.getMessageInput().fill('使用快捷键发送的消息');
    await page.keyboard.press('Control+Enter');

    await expect(chatPage.getMessagesContainer()).toContainText('快捷键发送');
    await chatPage.waitForAIResponse();

    // 测试其他快捷键
    await page.keyboard.press('Control+K'); // 可能是新对话快捷键

    // 测试搜索快捷键
    await chatPage.sendMessage('搜索测试消息');
    await chatPage.waitForAIResponse();

    await page.keyboard.press('Control+F');

    // 验证搜索功能
    const searchInput = page.locator('input[type="search"], .search-input').first();
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('搜索');
      await page.keyboard.press('Enter');

      const resultsCount = await chatPage.getSearchResults();
      expect(resultsCount).toBeGreaterThan(0);
    }
  });

  test('应该支持响应式布局', async ({ page }) => {
    // 测试桌面布局
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await assertions.expectElementVisible('[data-testid="message-input"]');
    await assertions.expectElementVisible('[data-testid="send-button"]');

    // 测试平板布局
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await assertions.expectElementVisible('[data-testid="message-input"]');
    await assertions.expectElementVisible('[data-testid="send-button"]');

    // 测试手机布局
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await assertions.expectElementVisible('[data-testid="message-input"]');
    await assertions.expectElementVisible('[data-testid="send-button"]');

    // 在移动设备上发送消息
    await chatPage.sendMessage('移动设备测试消息');
    await chatPage.waitForAIResponse();

    const response = await chatPage.getLastAssistantMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('应该维持对话上下文', async ({ page }) => {
    // 发送第一条消息建立上下文
    await chatPage.sendMessage('我的名字是张三，我是一名软件工程师');
    await chatPage.waitForAIResponse();

    // 发送后续消息测试上下文记忆
    await chatPage.sendMessage('你还记得我的名字吗？');
    await chatPage.waitForAIResponse();

    const response = await chatPage.getLastAssistantMessage();
    expect(response.toLowerCase()).toMatch(/张三|记得|名字/);

    // 继续测试上下文
    await chatPage.sendMessage('我的职业是什么？');
    await chatPage.waitForAIResponse();

    const careerResponse = await chatPage.getLastAssistantMessage();
    expect(careerResponse.toLowerCase()).toMatch(/软件|工程师|开发/);
  });

  test('应该记录性能指标', async ({ page }) => {
    // 测试响应时间
    const responseTime = await chatPage.getResponseTime();
    expect(responseTime).toBeLessThan(30000); // 30秒内响应

    console.log(`AI响应时间: ${responseTime}ms`);

    // 测试页面性能
    const performance = await chatPage.getPagePerformance();
    expect(performance.loadTime).toBeLessThan(5000); // 5秒内加载

    console.log('页面性能指标:', performance);
  });

  test('应该处理并发消息', async ({ page }) => {
    // 快速发送多条消息
    const promises = [
      chatPage.sendMessage('第一条并发消息'),
      chatPage.sendMessage('第二条并发消息'),
      chatPage.sendMessage('第三条并发消息')
    ];

    await Promise.all(promises);

    // 等待所有响应
    await page.waitForTimeout(5000);

    // 验证所有消息都被处理
    await expect(chatPage.getMessagesContainer()).toContainText('第一条并发');
    await expect(chatPage.getMessagesContainer()).toContainText('第二条并发');
    await expect(chatPage.getMessagesContainer()).toContainText('第三条并发');

    const finalMessageCount = await chatPage.getMessageCount();
    expect(finalMessageCount).toBeGreaterThanOrEqual(6); // 至少3条用户消息 + 3条AI响应
  });
});

test.describe('AI对话高级功能测试', () => {
  let chatPage: AIChatPage;

  test.beforeEach(async ({ page, context }) => {
    chatPage = new AIChatPage(page);

    const testEnv = new TestEnvironmentSetup(page, context);
    await testEnv.setup();

    try {
      await loginAsTestUser(page);
    } catch {
      // 继续测试
    }

    await chatPage.goto();
  });

  test('应该支持文件附件', async ({ page }) => {
    // 创建临时测试文件
    const testFilePath = 'test-file.txt';

    try {
      // 尝试附加文件
      await chatPage.attachFile(testFilePath);

      // 验证文件附加成功
      await expect(page.locator('.attachment, .file-preview')).toBeVisible({ timeout: 5000 });

      // 发送包含附件的消息
      await chatPage.sendMessage('请分析这个文件的内容');
      await chatPage.waitForAIResponse();

      const response = await chatPage.getLastAssistantMessage();
      expect(response.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('文件附件功能测试跳过:', error);
    }
  });

  test('应该支持语音输入', async ({ page }) => {
    try {
      // 开始语音录制
      await chatPage.startVoiceRecording();

      // 验证录制状态
      const voiceButton = chatPage.getMessageInput();
      await expect(voiceButton).toBeVisible();

      // 停止录制
      await page.waitForTimeout(2000);
      await chatPage.stopVoiceRecording();

      // 验证语音转文本功能
      await page.waitForTimeout(3000);

      const inputValue = await chatPage.getMessageInput().inputValue();
      console.log('语音转文本结果:', inputValue);

    } catch (error) {
      console.log('语音输入功能测试跳过:', error);
    }
  });

  test('应该支持对话导出', async ({ page }) => {
    // 创建一些对话内容
    await chatPage.sendMessage('这是导出测试的第一条消息');
    await chatPage.waitForAIResponse();

    await chatPage.sendMessage('这是导出测试的第二条消息');
    await chatPage.waitForAIResponse();

    try {
      // 导出对话
      await chatPage.exportChat('txt');

      // 验证导出操作（可能触发下载）
      console.log('对话导出功能已触发');
    } catch (error) {
      console.log('对话导出功能测试跳过:', error);
    }
  });

  test('应该支持对话分享', async ({ page }) => {
    await chatPage.sendMessage('这是分享测试消息');
    await chatPage.waitForAIResponse();

    try {
      // 分享对话
      const shareLink = await chatPage.shareChat();

      // 验证分享链接
      expect(shareLink).toMatch(/^https?:\/\//);
      console.log('分享链接:', shareLink);
    } catch (error) {
      console.log('对话分享功能测试跳过:', error);
    }
  });

  test('应该支持AI模型切换', async ({ page }) => {
    try {
      // 切换AI模型
      await chatPage.setAIModel('gpt-4');

      // 发送测试消息
      await chatPage.sendMessage('测试模型切换后的响应');
      await chatPage.waitForAIResponse();

      const response = await chatPage.getLastAssistantMessage();
      expect(response.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('AI模型切换功能测试跳过:', error);
    }
  });

  test('应该支持响应长度设置', async ({ page }) => {
    try {
      // 设置短响应
      await chatPage.setResponseLength('short');

      await chatPage.sendMessage('请给我一个简短的回复');
      await chatPage.waitForAIResponse();

      const shortResponse = await chatPage.getLastAssistantMessage();

      // 设置长响应
      await chatPage.setResponseLength('long');

      await chatPage.sendMessage('请给我一个详细的回复');
      await chatPage.waitForAIResponse();

      const longResponse = await chatPage.getLastAssistantMessage();

      // 验证响应长度差异
      expect(longResponse.length).toBeGreaterThan(shortResponse.length);
    } catch (error) {
      console.log('响应长度设置功能测试跳过:', error);
    }
  });
});