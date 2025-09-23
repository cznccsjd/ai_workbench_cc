/**
 * AI对话页面对象类
 * 封装AI对话页面的元素和操作
 */

import { Page, Locator, expect } from '@playwright/test';

export class AIChatPage {
  private page: Page;

  // 主要页面元素
  private chatContainer: Locator;
  private messageInput: Locator;
  private sendButton: Locator;
  private messagesContainer: Locator;

  // 会话管理
  private sessionsList: Locator;
  private newSessionButton: Locator;
  private sessionTitle: Locator;

  // 消息元素
  private userMessages: Locator;
  private assistantMessages: Locator;
  private typingIndicator: Locator;

  // 工具栏和功能
  private attachButton: Locator;
  private voiceButton: Locator;
  private settingsButton: Locator;
  private clearButton: Locator;

  // 右侧面板
  private rightPanel: Locator;
  private chatHistory: Locator;
  private suggestions: Locator;

  // 状态指示器
  private connectionStatus: Locator;
  private processingIndicator: Locator;
  private errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // 初始化页面元素定位器
    this.chatContainer = page.locator('[data-testid="chat-container"], .chat-container, .chat-main');
    this.messageInput = page.locator('[data-testid="message-input"], textarea[placeholder*="输入"], input[placeholder*="消息"]');
    this.sendButton = page.locator('[data-testid="send-button"], button:has-text("发送"), button[type="submit"]');
    this.messagesContainer = page.locator('[data-testid="messages"], .messages, .chat-messages');

    this.sessionsList = page.locator('[data-testid="sessions"], .sessions, .chat-sessions');
    this.newSessionButton = page.locator('[data-testid="new-session"], button:has-text("新建"), button:has-text("新对话")');
    this.sessionTitle = page.locator('[data-testid="session-title"], .session-title, h1');

    this.userMessages = page.locator('[data-testid="user-message"], .message.user, .user-message');
    this.assistantMessages = page.locator('[data-testid="assistant-message"], .message.assistant, .ai-message');
    this.typingIndicator = page.locator('[data-testid="typing"], .typing, .thinking, .processing');

    this.attachButton = page.locator('[data-testid="attach"], button[title*="附件"], .attach-button');
    this.voiceButton = page.locator('[data-testid="voice"], button[title*="语音"], .voice-button');
    this.settingsButton = page.locator('[data-testid="settings"], button[title*="设置"], .settings-button');
    this.clearButton = page.locator('[data-testid="clear"], button:has-text("清空"), .clear-button');

    this.rightPanel = page.locator('[data-testid="right-panel"], .right-panel, .sidebar');
    this.chatHistory = page.locator('[data-testid="chat-history"], .history, .previous-chats');
    this.suggestions = page.locator('[data-testid="suggestions"], .suggestions, .quick-replies');

    this.connectionStatus = page.locator('[data-testid="connection-status"], .status, .connection-indicator');
    this.processingIndicator = page.locator('[data-testid="processing"], .loading, .spinner');
    this.errorMessage = page.locator('[data-testid="error"], .error, .alert-error');
  }

  // 导航方法
  async goto(): Promise<void> {
    await this.page.goto('/ai-chat');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  // 消息发送方法
  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
  }

  async sendMessageWithEnter(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async sendMultilineMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.page.keyboard.press('Shift+Enter'); // 添加换行
    await this.messageInput.fill(message + '\n更多内容');
    await this.sendButton.click();
    await this.page.waitForTimeout(500);
  }

  // 等待AI响应
  async waitForAIResponse(timeout: number = 15000): Promise<void> {
    try {
      // 等待输入指示器出现
      await this.typingIndicator.waitFor({ state: 'visible', timeout: 3000 });
      // 等待输入指示器消失（AI响应完成）
      await this.typingIndicator.waitFor({ state: 'hidden', timeout });
    } catch {
      // 如果没有输入指示器，等待一段时间确保响应完成
      await this.page.waitForTimeout(3000);
    }
  }

  // 消息获取方法
  async getLastUserMessage(): Promise<string> {
    const lastUserMsg = this.userMessages.last();
    return await lastUserMsg.textContent() || '';
  }

  async getLastAssistantMessage(): Promise<string> {
    const lastAIMsg = this.assistantMessages.last();
    return await lastAIMsg.textContent() || '';
  }

  async getAllMessages(): Promise<Array<{type: 'user' | 'assistant', content: string}>> {
    const messages: Array<{type: 'user' | 'assistant', content: string}> = [];

    // 获取所有消息元素
    const allMessages = this.messagesContainer.locator('.message, [data-message-type]');
    const count = await allMessages.count();

    for (let i = 0; i < count; i++) {
      const message = allMessages.nth(i);
      const content = await message.textContent() || '';

      // 判断消息类型
      const classList = await message.getAttribute('class') || '';
      const messageType = await message.getAttribute('data-message-type');

      if (classList.includes('user') || messageType === 'user') {
        messages.push({ type: 'user', content });
      } else if (classList.includes('assistant') || classList.includes('ai') || messageType === 'assistant') {
        messages.push({ type: 'assistant', content });
      }
    }

    return messages;
  }

  async getMessageCount(): Promise<number> {
    const allMessages = this.messagesContainer.locator('.message, [data-message-type]');
    return await allMessages.count();
  }

  // 会话管理方法
  async createNewSession(): Promise<void> {
    await this.newSessionButton.click();
    await this.page.waitForTimeout(1000);
  }

  async selectSession(sessionName: string): Promise<void> {
    const session = this.sessionsList.locator(`text="${sessionName}"`).first();
    await session.click();
    await this.page.waitForTimeout(1000);
  }

  async deleteSession(sessionName: string): Promise<void> {
    const session = this.sessionsList.locator(`text="${sessionName}"`).first();
    await session.hover();

    const deleteButton = session.locator('button:has-text("删除"), .delete-button');
    await deleteButton.click();

    // 确认删除
    const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("删除")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
  }

  async renameSession(oldName: string, newName: string): Promise<void> {
    const session = this.sessionsList.locator(`text="${oldName}"`).first();
    await session.hover();

    const editButton = session.locator('button:has-text("编辑"), .edit-button');
    await editButton.click();

    const nameInput = this.page.locator('input[value*="' + oldName + '"], input[placeholder*="名称"]');
    await nameInput.fill(newName);
    await this.page.keyboard.press('Enter');
  }

  async getCurrentSessionName(): Promise<string> {
    return await this.sessionTitle.textContent() || '';
  }

  // 清空对话
  async clearChat(): Promise<void> {
    await this.clearButton.click();

    // 确认清空
    const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("清空")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    await this.page.waitForTimeout(1000);
  }

  // 附件功能
  async attachFile(filePath: string): Promise<void> {
    await this.attachButton.click();

    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000);
  }

  async attachImage(imagePath: string): Promise<void> {
    await this.attachFile(imagePath);

    // 等待图片预览出现
    const imagePreview = this.page.locator('[data-testid="image-preview"], .image-preview');
    await imagePreview.waitFor({ state: 'visible', timeout: 5000 });
  }

  // 语音功能
  async startVoiceRecording(): Promise<void> {
    await this.voiceButton.click();
    await this.page.waitForTimeout(500);
  }

  async stopVoiceRecording(): Promise<void> {
    await this.voiceButton.click();
    await this.page.waitForTimeout(1000);
  }

  // 快速回复和建议
  async clickSuggestion(suggestionText: string): Promise<void> {
    const suggestion = this.suggestions.locator(`text="${suggestionText}"`).first();
    await suggestion.click();
    await this.page.waitForTimeout(500);
  }

  async getSuggestions(): Promise<string[]> {
    const suggestions = this.suggestions.locator('.suggestion, .quick-reply');
    return await suggestions.allTextContents();
  }

  // 消息操作方法
  async copyMessage(messageText: string): Promise<void> {
    const message = this.messagesContainer.locator(`text="${messageText}"`).first();
    await message.hover();

    const copyButton = message.locator('button:has-text("复制"), .copy-button').first();
    await copyButton.click();
  }

  async regenerateResponse(): Promise<void> {
    const lastAIMessage = this.assistantMessages.last();
    await lastAIMessage.hover();

    const regenerateButton = lastAIMessage.locator('button:has-text("重新生成"), .regenerate-button');
    await regenerateButton.click();

    await this.waitForAIResponse();
  }

  async editMessage(messageText: string, newText: string): Promise<void> {
    const message = this.messagesContainer.locator(`text="${messageText}"`).first();
    await message.hover();

    const editButton = message.locator('button:has-text("编辑"), .edit-button');
    await editButton.click();

    const editInput = this.page.locator('textarea[data-editing="true"], .message-edit-input');
    await editInput.fill(newText);
    await this.page.keyboard.press('Enter');
  }

  async deleteMessage(messageText: string): Promise<void> {
    const message = this.messagesContainer.locator(`text="${messageText}"`).first();
    await message.hover();

    const deleteButton = message.locator('button:has-text("删除"), .delete-button');
    await deleteButton.click();

    // 确认删除
    const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("删除")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
  }

  // 设置和配置
  async openSettings(): Promise<void> {
    await this.settingsButton.click();
    await this.page.waitForTimeout(500);
  }

  async setAIModel(modelName: string): Promise<void> {
    await this.openSettings();

    const modelSelect = this.page.locator('select[name="model"], [data-setting="model"]');
    await modelSelect.selectOption(modelName);

    const saveButton = this.page.locator('button:has-text("保存"), button:has-text("确定")');
    await saveButton.click();
  }

  async setResponseLength(length: 'short' | 'medium' | 'long'): Promise<void> {
    await this.openSettings();

    const lengthOption = this.page.locator(`[data-length="${length}"], input[value="${length}"]`);
    await lengthOption.click();

    const saveButton = this.page.locator('button:has-text("保存"), button:has-text("确定")');
    await saveButton.click();
  }

  async enableTypingSound(enable: boolean): Promise<void> {
    await this.openSettings();

    const soundToggle = this.page.locator('input[name="typing-sound"], [data-setting="sound"]');
    if (enable) {
      await soundToggle.check();
    } else {
      await soundToggle.uncheck();
    }

    const saveButton = this.page.locator('button:has-text("保存"), button:has-text("确定")');
    await saveButton.click();
  }

  // 状态检查方法
  async isConnected(): Promise<boolean> {
    const status = await this.connectionStatus.textContent();
    return status?.includes('连接') || status?.includes('在线') || false;
  }

  async isProcessing(): Promise<boolean> {
    return await this.processingIndicator.isVisible();
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async dismissError(): Promise<void> {
    const dismissButton = this.errorMessage.locator('button, .close, .dismiss');
    await dismissButton.click();
  }

  // 导出和分享
  async exportChat(format: 'txt' | 'pdf' | 'html' = 'txt'): Promise<void> {
    const exportButton = this.page.locator('[data-testid="export"], button:has-text("导出")');
    await exportButton.click();

    const formatOption = this.page.locator(`[data-format="${format}"], button:has-text("${format.toUpperCase()}")`);
    await formatOption.click();
  }

  async shareChat(): Promise<string> {
    const shareButton = this.page.locator('[data-testid="share"], button:has-text("分享")');
    await shareButton.click();

    const shareLink = this.page.locator('[data-testid="share-link"], input[readonly]');
    return await shareLink.inputValue();
  }

  // 搜索功能
  async searchInChat(query: string): Promise<void> {
    await this.page.keyboard.press('Control+F');
    const searchInput = this.page.locator('input[type="search"], .search-input');
    await searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async getSearchResults(): Promise<number> {
    const results = this.page.locator('.search-highlight, .highlighted');
    return await results.count();
  }

  // 特殊功能测试
  async testLongMessage(): Promise<void> {
    const longMessage = 'A'.repeat(5000); // 5000字符的长消息
    await this.sendMessage(longMessage);
    await this.waitForAIResponse();
  }

  async testEmojiMessage(): Promise<void> {
    const emojiMessage = '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥸🤩🥳';
    await this.sendMessage(emojiMessage);
    await this.waitForAIResponse();
  }

  async testSpecialCharacters(): Promise<void> {
    const specialMessage = '<script>alert("test")</script> & "quotes" & \'single\' & 中文测试 & עברית & العربية';
    await this.sendMessage(specialMessage);
    await this.waitForAIResponse();
  }

  async testCodeMessage(): Promise<void> {
    const codeMessage = `
请帮我写一个Python函数：

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

这个函数正确吗？
    `;
    await this.sendMessage(codeMessage);
    await this.waitForAIResponse();
  }

  // 性能监控
  async getResponseTime(): Promise<number> {
    const startTime = Date.now();
    await this.sendMessage('Hello, how are you?');
    await this.waitForAIResponse();
    return Date.now() - startTime;
  }

  async getPagePerformance(): Promise<{
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  }> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;

      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        memoryUsage: memory ? memory.usedJSHeapSize : 0
      };
    });
  }

  // 获取器方法
  getMessageInput(): Locator {
    return this.messageInput;
  }

  getSendButton(): Locator {
    return this.sendButton;
  }

  getMessagesContainer(): Locator {
    return this.messagesContainer;
  }

  getSessionsList(): Locator {
    return this.sessionsList;
  }

  getTypingIndicator(): Locator {
    return this.typingIndicator;
  }

  getErrorMessage(): Locator {
    return this.errorMessage;
  }

  getRightPanel(): Locator {
    return this.rightPanel;
  }

  // 辅助方法
  async scrollToTop(): Promise<void> {
    await this.messagesContainer.evaluate(el => el.scrollTop = 0);
  }

  async scrollToBottom(): Promise<void> {
    await this.messagesContainer.evaluate(el => el.scrollTop = el.scrollHeight);
  }

  async isMessageVisible(messageText: string): Promise<boolean> {
    const message = this.messagesContainer.locator(`text="${messageText}"`);
    return await message.isVisible();
  }

  async waitForMessageToAppear(messageText: string, timeout: number = 10000): Promise<void> {
    const message = this.messagesContainer.locator(`text="${messageText}"`);
    await message.waitFor({ state: 'visible', timeout });
  }
}