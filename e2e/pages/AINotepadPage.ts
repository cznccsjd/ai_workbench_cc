/**
 * AI记事本页面对象类
 * 封装AI记事本页面的元素和操作
 */

import { Page, Locator, expect } from '@playwright/test';

export class AINotepadPage {
  private page: Page;

  // 主要页面元素
  private notesList: Locator;
  private newNoteButton: Locator;
  private searchInput: Locator;
  private noteTitleInput: Locator;
  private noteContentTextarea: Locator;

  // AI功能按钮
  private organizeButton: Locator;
  private extractTodosButton: Locator;
  private aiProcessingIndicator: Locator;

  // 工具栏元素
  private boldButton: Locator;
  private italicButton: Locator;
  private previewButton: Locator;
  private editButton: Locator;

  // 面板元素
  private leftPanel: Locator;
  private centerPanel: Locator;
  private rightPanel: Locator;
  private todoPanel: Locator;
  private previewPanel: Locator;

  // 统计信息
  private wordCount: Locator;
  private readingTime: Locator;

  // 书签和收藏
  private bookmarkButton: Locator;

  // 错误处理
  private errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // 初始化页面元素定位器
    this.notesList = page.locator('[data-testid="notes-list"], .notes-list, .sidebar .note-item');
    this.newNoteButton = page.locator('[data-testid="new-note"], button:has-text("新建"), button:has-text("新笔记")');
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="搜索"], input[type="search"]');

    this.noteTitleInput = page.locator('[data-testid="note-title"], input[placeholder*="标题"], input[name="title"]');
    this.noteContentTextarea = page.locator('[data-testid="note-content"], textarea[placeholder*="内容"], .editor, .note-editor');

    this.organizeButton = page.locator('[data-testid="organize-note"], button:has-text("整理"), button:has-text("AI整理")');
    this.extractTodosButton = page.locator('[data-testid="extract-todos"], button:has-text("提取"), button:has-text("Todo")');
    this.aiProcessingIndicator = page.locator('[data-testid="ai-processing"], .loading, .processing, .spinner');

    this.boldButton = page.locator('[data-testid="bold"], button[title*="粗体"], button:has-text("B")');
    this.italicButton = page.locator('[data-testid="italic"], button[title*="斜体"], button:has-text("I")');
    this.previewButton = page.locator('[data-testid="preview"], button:has-text("预览")');
    this.editButton = page.locator('[data-testid="edit"], button:has-text("编辑")');

    this.leftPanel = page.locator('[data-testid="left-panel"], .sidebar, .notes-sidebar');
    this.centerPanel = page.locator('[data-testid="center-panel"], .editor-panel, .main-content');
    this.rightPanel = page.locator('[data-testid="right-panel"], .todo-panel, .right-sidebar');
    this.todoPanel = page.locator('[data-testid="todo-panel"], .todos, .todo-list');
    this.previewPanel = page.locator('[data-testid="preview-panel"], .preview, .markdown-preview');

    this.wordCount = page.locator('[data-testid="word-count"], .word-count, .stats .words');
    this.readingTime = page.locator('[data-testid="reading-time"], .reading-time, .stats .time');

    this.bookmarkButton = page.locator('[data-testid="bookmark"], button[title*="收藏"], .bookmark');

    this.errorMessage = page.locator('[data-testid="error"], .error, .alert-error');
  }

  // 导航方法
  async goto(): Promise<void> {
    await this.page.goto('/ai-notepad');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  // 笔记管理方法
  async createNewNote(): Promise<void> {
    await this.newNoteButton.click();
    await this.page.waitForTimeout(500);
  }

  async editNoteTitle(title: string): Promise<void> {
    await this.noteTitleInput.fill(title);
    await this.page.waitForTimeout(300);
  }

  async editNoteContent(content: string): Promise<void> {
    await this.noteContentTextarea.fill(content);
    await this.page.waitForTimeout(500);
  }

  async selectNoteByTitle(title: string): Promise<void> {
    const noteItem = this.page.locator(`.note-item:has-text("${title}"), [data-note-title="${title}"]`).first();
    await noteItem.click();
    await this.page.waitForTimeout(500);
  }

  // AI功能方法
  async organizeNoteWithAI(): Promise<void> {
    await this.organizeButton.click();
  }

  async extractTodosFromNote(): Promise<void> {
    await this.extractTodosButton.click();
  }

  async waitForAIProcessingToComplete(timeout: number = 10000): Promise<void> {
    try {
      await this.aiProcessingIndicator.waitFor({ state: 'visible', timeout: 2000 });
      await this.aiProcessingIndicator.waitFor({ state: 'hidden', timeout });
    } catch {
      // 如果处理指示器没有出现或很快消失，等待一下确保处理完成
      await this.page.waitForTimeout(2000);
    }
  }

  // 搜索方法
  async searchNotes(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async getSearchResults(): Promise<string[]> {
    const results = await this.notesList.locator('.note-item').allTextContents();
    return results;
  }

  // 书签方法
  async toggleBookmark(): Promise<void> {
    await this.bookmarkButton.click();
    await this.page.waitForTimeout(300);
  }

  async isNoteBookmarked(): Promise<boolean> {
    const bookmarkState = await this.bookmarkButton.getAttribute('class');
    return bookmarkState?.includes('active') || bookmarkState?.includes('bookmarked') || false;
  }

  // 格式化方法
  async selectTextInEditor(text: string, startIndex: number = 0): Promise<void> {
    await this.noteContentTextarea.click();

    // 选择文本
    await this.page.evaluate(({ text, startIndex }) => {
      const textarea = document.querySelector('[data-testid="note-content"], textarea') as HTMLTextAreaElement;
      if (textarea) {
        const content = textarea.value;
        const index = content.indexOf(text, startIndex);
        if (index !== -1) {
          textarea.setSelectionRange(index, index + text.length);
          textarea.focus();
        }
      }
    }, { text, startIndex });
  }

  async applyBoldFormatting(): Promise<void> {
    await this.boldButton.click();
  }

  async applyItalicFormatting(): Promise<void> {
    await this.italicButton.click();
  }

  // 预览模式方法
  async switchToPreviewMode(): Promise<void> {
    await this.previewButton.click();
    await this.page.waitForTimeout(500);
  }

  async switchToEditMode(): Promise<void> {
    await this.editButton.click();
    await this.page.waitForTimeout(500);
  }

  // Todo管理方法
  async getTodoCount(): Promise<number> {
    const todos = this.todoPanel.locator('.todo-item, [data-testid="todo-item"]');
    return await todos.count();
  }

  async getAllTodos(): Promise<Locator[]> {
    const todos = this.todoPanel.locator('.todo-item, [data-testid="todo-item"]');
    const count = await todos.count();
    const todoList: Locator[] = [];

    for (let i = 0; i < count; i++) {
      todoList.push(todos.nth(i));
    }

    return todoList;
  }

  async toggleTodoCompletion(todo: Locator): Promise<void> {
    const checkbox = todo.locator('input[type="checkbox"], .todo-checkbox');
    await checkbox.click();
  }

  async isTodoCompleted(todo: Locator): Promise<boolean> {
    const checkbox = todo.locator('input[type="checkbox"], .todo-checkbox');
    return await checkbox.isChecked();
  }

  // 错误处理方法
  async closeErrorMessage(): Promise<void> {
    const closeButton = this.errorMessage.locator('button, .close, .dismiss');
    await closeButton.click();
  }

  // 响应式布局方法
  async getMobileLayout(): Locator {
    return this.page.locator('.mobile-layout, [data-mobile="true"]');
  }

  // 预览渲染元素获取方法
  async getRenderedHeading(text: string): Promise<Locator> {
    return this.previewPanel.locator(`h1:has-text("${text}"), h2:has-text("${text}"), h3:has-text("${text}")`);
  }

  async getRenderedBoldText(text: string): Promise<Locator> {
    return this.previewPanel.locator(`strong:has-text("${text}"), b:has-text("${text}")`);
  }

  async getRenderedItalicText(text: string): Promise<Locator> {
    return this.previewPanel.locator(`em:has-text("${text}"), i:has-text("${text}")`);
  }

  async getRenderedLink(text: string): Promise<Locator> {
    return this.previewPanel.locator(`a:has-text("${text}")`);
  }

  // 获取器方法
  getNoteTitleInput(): Locator {
    return this.noteTitleInput;
  }

  getNoteContentTextarea(): Locator {
    return this.noteContentTextarea;
  }

  getWordCount(): Locator {
    return this.wordCount;
  }

  getReadingTime(): Locator {
    return this.readingTime;
  }

  getAIProcessingIndicator(): Locator {
    return this.aiProcessingIndicator;
  }

  getTodoPanel(): Locator {
    return this.todoPanel;
  }

  getPreviewPanel(): Locator {
    return this.previewPanel;
  }

  getLeftPanel(): Locator {
    return this.leftPanel;
  }

  getCenterPanel(): Locator {
    return this.centerPanel;
  }

  getRightPanel(): Locator {
    return this.rightPanel;
  }

  getErrorMessage(): Locator {
    return this.errorMessage;
  }

  // 高级功能方法
  async exportNote(format: 'markdown' | 'pdf' | 'html' = 'markdown'): Promise<void> {
    const exportButton = this.page.locator('[data-testid="export"], button:has-text("导出")');
    await exportButton.click();

    const formatOption = this.page.locator(`[data-format="${format}"], button:has-text("${format.toUpperCase()}")`);
    await formatOption.click();
  }

  async importNote(filePath: string): Promise<void> {
    const importButton = this.page.locator('[data-testid="import"], button:has-text("导入")');
    await importButton.click();

    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async deleteNote(): Promise<void> {
    const deleteButton = this.page.locator('[data-testid="delete"], button:has-text("删除")');
    await deleteButton.click();

    // 确认删除
    const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("删除")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
  }

  async duplicateNote(): Promise<void> {
    const duplicateButton = this.page.locator('[data-testid="duplicate"], button:has-text("复制")');
    await duplicateButton.click();
  }

  async shareNote(): Promise<string> {
    const shareButton = this.page.locator('[data-testid="share"], button:has-text("分享")');
    await shareButton.click();

    const shareLink = this.page.locator('[data-testid="share-link"], input[readonly]');
    return await shareLink.inputValue();
  }

  // 标签管理方法
  async addTag(tag: string): Promise<void> {
    const tagInput = this.page.locator('[data-testid="tag-input"], input[placeholder*="标签"]');
    await tagInput.fill(tag);
    await this.page.keyboard.press('Enter');
  }

  async removeTag(tag: string): Promise<void> {
    const tagElement = this.page.locator(`[data-tag="${tag}"], .tag:has-text("${tag}")`);
    const removeButton = tagElement.locator('.remove, .close, .delete');
    await removeButton.click();
  }

  async filterByTag(tag: string): Promise<void> {
    const tagFilter = this.page.locator(`[data-tag-filter="${tag}"], .tag-filter:has-text("${tag}")`);
    await tagFilter.click();
  }

  // 分类管理方法
  async setNoteCategory(category: string): Promise<void> {
    const categorySelect = this.page.locator('[data-testid="category"], select[name="category"]');
    await categorySelect.selectOption(category);
  }

  async filterByCategory(category: string): Promise<void> {
    const categoryFilter = this.page.locator(`[data-category-filter="${category}"]`);
    await categoryFilter.click();
  }

  // 协作功能方法
  async inviteCollaborator(email: string): Promise<void> {
    const collaborateButton = this.page.locator('[data-testid="collaborate"], button:has-text("协作")');
    await collaborateButton.click();

    const emailInput = this.page.locator('input[type="email"], input[placeholder*="邮箱"]');
    await emailInput.fill(email);

    const inviteButton = this.page.locator('button:has-text("邀请"), button:has-text("发送")');
    await inviteButton.click();
  }

  async viewNoteHistory(): Promise<void> {
    const historyButton = this.page.locator('[data-testid="history"], button:has-text("历史")');
    await historyButton.click();
  }

  async restoreNoteVersion(version: string): Promise<void> {
    const versionItem = this.page.locator(`[data-version="${version}"], .version-item:has-text("${version}")`);
    const restoreButton = versionItem.locator('button:has-text("恢复")');
    await restoreButton.click();
  }

  // 性能监控方法
  async getPerformanceMetrics(): Promise<{
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

  // 键盘快捷键方法
  async saveNote(): Promise<void> {
    await this.page.keyboard.press('Control+S');
  }

  async undoLastAction(): Promise<void> {
    await this.page.keyboard.press('Control+Z');
  }

  async redoLastAction(): Promise<void> {
    await this.page.keyboard.press('Control+Y');
  }

  async findInNote(text: string): Promise<void> {
    await this.page.keyboard.press('Control+F');
    await this.page.locator('input[type="search"], .search-input').fill(text);
  }

  async replaceInNote(searchText: string, replaceText: string): Promise<void> {
    await this.page.keyboard.press('Control+H');
    await this.page.locator('input[placeholder*="查找"]').fill(searchText);
    await this.page.locator('input[placeholder*="替换"]').fill(replaceText);
    await this.page.locator('button:has-text("全部替换")').click();
  }
}