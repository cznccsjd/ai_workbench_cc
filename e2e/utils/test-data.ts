/**
 * 测试数据管理工具
 */

import { Page, APIRequestContext } from '@playwright/test';

export interface TestNote {
  id?: string;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestChatMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  sessionId?: string;
}

export interface TestKanbanBoard {
  id?: string;
  name: string;
  description?: string;
  columns?: TestKanbanColumn[];
}

export interface TestKanbanColumn {
  id?: string;
  name: string;
  boardId?: string;
  position?: number;
  cards?: TestKanbanCard[];
}

export interface TestKanbanCard {
  id?: string;
  title: string;
  description?: string;
  columnId?: string;
  position?: number;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface TestPomodoroSession {
  id?: string;
  duration: number;
  breakDuration: number;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
}

export class TestDataManager {
  private page: Page;
  private apiContext: APIRequestContext;
  private baseURL: string;

  constructor(page: Page, apiContext: APIRequestContext, baseURL = 'http://localhost:8000') {
    this.page = page;
    this.apiContext = apiContext;
    this.baseURL = baseURL;
  }

  // AI记事本测试数据
  async createTestNote(note: TestNote): Promise<TestNote> {
    const response = await this.apiContext.post(`${this.baseURL}/api/notes`, {
      data: note
    });

    if (response.ok()) {
      return await response.json();
    }

    // 如果API不可用，使用前端创建
    await this.page.goto('/ai-notepad');
    await this.page.waitForLoadState('networkidle');

    // 点击新建笔记
    const newNoteButton = this.page.locator('button:has-text("新建"), button[data-testid="new-note"]').first();
    await newNoteButton.click();

    // 填写标题
    await this.page.fill('input[placeholder*="标题"], input[name="title"]', note.title);

    // 填写内容
    const contentEditor = this.page.locator('textarea[placeholder*="内容"], .editor, [data-testid="note-editor"]').first();
    await contentEditor.fill(note.content);

    // 保存笔记
    const saveButton = this.page.locator('button:has-text("保存"), button[data-testid="save-note"]').first();
    await saveButton.click();

    await this.page.waitForLoadState('networkidle');

    return { ...note, id: Date.now().toString() };
  }

  async createMultipleTestNotes(count: number = 5): Promise<TestNote[]> {
    const notes: TestNote[] = [];
    const sampleNotes = [
      {
        title: '项目计划',
        content: '这是一个重要的项目计划文档，包含了详细的时间安排和任务分解。',
        tags: ['工作', '计划'],
        category: '项目管理'
      },
      {
        title: '学习笔记',
        content: '今天学习了React Hooks的使用方法，特别是useState和useEffect的实际应用。',
        tags: ['学习', 'React'],
        category: '技术'
      },
      {
        title: '会议纪要',
        content: '团队周会讨论了下周的工作安排和项目进展情况。',
        tags: ['会议', '团队'],
        category: '工作'
      },
      {
        title: '灵感记录',
        content: '关于用户体验改进的一些想法和建议。',
        tags: ['灵感', 'UX'],
        category: '创意'
      },
      {
        title: '待办事项',
        content: '1. 完成项目文档\n2. 参加团队会议\n3. 代码审查',
        tags: ['待办', '任务'],
        category: '任务'
      }
    ];

    for (let i = 0; i < Math.min(count, sampleNotes.length); i++) {
      const note = await this.createTestNote(sampleNotes[i]);
      notes.push(note);
    }

    return notes;
  }

  // AI对话测试数据
  async createTestChatSession(messages: TestChatMessage[]): Promise<string> {
    const sessionId = `test-session-${Date.now()}`;

    await this.page.goto('/ai-chat');
    await this.page.waitForLoadState('networkidle');

    for (const message of messages) {
      if (message.role === 'user') {
        // 发送用户消息
        const chatInput = this.page.locator('textarea[placeholder*="输入"], input[placeholder*="消息"], [data-testid="chat-input"]').first();
        await chatInput.fill(message.content);

        const sendButton = this.page.locator('button:has-text("发送"), button[data-testid="send-button"]').first();
        await sendButton.click();

        // 等待AI响应
        await this.page.waitForTimeout(2000);
      }
    }

    return sessionId;
  }

  // 看板测试数据
  async createTestKanbanBoard(board: TestKanbanBoard): Promise<TestKanbanBoard> {
    await this.page.goto('/projects');
    await this.page.waitForLoadState('networkidle');

    // 创建新看板
    const newBoardButton = this.page.locator('button:has-text("新建"), button[data-testid="new-board"]').first();
    await newBoardButton.click();

    // 填写看板信息
    await this.page.fill('input[placeholder*="名称"], input[name="name"]', board.name);
    if (board.description) {
      await this.page.fill('textarea[placeholder*="描述"], textarea[name="description"]', board.description);
    }

    // 保存看板
    const saveButton = this.page.locator('button:has-text("保存"), button:has-text("创建")').first();
    await saveButton.click();

    await this.page.waitForLoadState('networkidle');

    return { ...board, id: Date.now().toString() };
  }

  async createTestKanbanCard(boardId: string, columnId: string, card: TestKanbanCard): Promise<TestKanbanCard> {
    // 添加新卡片
    const addCardButton = this.page.locator(`[data-column-id="${columnId}"] button:has-text("添加")`).first();
    await addCardButton.click();

    // 填写卡片信息
    await this.page.fill('input[placeholder*="标题"], input[name="title"]', card.title);
    if (card.description) {
      await this.page.fill('textarea[placeholder*="描述"], textarea[name="description"]', card.description);
    }

    // 保存卡片
    const saveButton = this.page.locator('button:has-text("保存"), button:has-text("添加")').first();
    await saveButton.click();

    await this.page.waitForTimeout(1000);

    return { ...card, id: Date.now().toString(), columnId };
  }

  // 番茄钟测试数据
  async createTestPomodoroSession(session: TestPomodoroSession): Promise<TestPomodoroSession> {
    await this.page.goto('/pomodoro');
    await this.page.waitForLoadState('networkidle');

    // 设置番茄钟时长
    const durationInput = this.page.locator('input[type="number"], input[name="duration"]').first();
    await durationInput.fill(session.duration.toString());

    // 设置休息时长
    const breakInput = this.page.locator('input[name="breakDuration"], input[placeholder*="休息"]').first();
    if (await breakInput.isVisible()) {
      await breakInput.fill(session.breakDuration.toString());
    }

    return { ...session, id: Date.now().toString() };
  }

  // 清理测试数据
  async clearAllTestData(): Promise<void> {
    try {
      // 尝试通过API清理
      await this.apiContext.delete(`${this.baseURL}/api/test-data`);
    } catch {
      // 如果API不可用，通过前端清理
      await this.clearTestDataFromUI();
    }

    // 清理浏览器存储
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await this.page.context().clearCookies();
  }

  private async clearTestDataFromUI(): Promise<void> {
    // 清理AI记事本数据
    await this.page.goto('/ai-notepad');
    await this.page.waitForLoadState('networkidle');

    const deleteButtons = this.page.locator('button:has-text("删除"), [data-testid="delete-note"]');
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      const button = deleteButtons.nth(0);
      if (await button.isVisible()) {
        await button.click();
        // 确认删除
        const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("删除")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        await this.page.waitForTimeout(500);
      }
    }

    // 清理看板数据
    await this.page.goto('/projects');
    await this.page.waitForLoadState('networkidle');

    const boardDeleteButtons = this.page.locator('button:has-text("删除"), [data-testid="delete-board"]');
    const boardCount = await boardDeleteButtons.count();
    for (let i = 0; i < boardCount; i++) {
      const button = boardDeleteButtons.nth(0);
      if (await button.isVisible()) {
        await button.click();
        // 确认删除
        const confirmButton = this.page.locator('button:has-text("确认"), button:has-text("删除")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        await this.page.waitForTimeout(500);
      }
    }
  }

  // 验证数据存在性
  async verifyNoteExists(noteTitle: string): Promise<boolean> {
    await this.page.goto('/ai-notepad');
    await this.page.waitForLoadState('networkidle');

    const noteElement = this.page.locator(`text="${noteTitle}"`);
    return await noteElement.isVisible();
  }

  async verifyBoardExists(boardName: string): Promise<boolean> {
    await this.page.goto('/projects');
    await this.page.waitForLoadState('networkidle');

    const boardElement = this.page.locator(`text="${boardName}"`);
    return await boardElement.isVisible();
  }

  // 获取测试数据统计
  async getTestDataStats(): Promise<{
    notesCount: number;
    boardsCount: number;
    chatSessionsCount: number;
  }> {
    const stats = {
      notesCount: 0,
      boardsCount: 0,
      chatSessionsCount: 0
    };

    try {
      // 统计笔记数量
      await this.page.goto('/ai-notepad');
      await this.page.waitForLoadState('networkidle');
      const notes = this.page.locator('[data-testid="note-item"], .note-item');
      stats.notesCount = await notes.count();

      // 统计看板数量
      await this.page.goto('/projects');
      await this.page.waitForLoadState('networkidle');
      const boards = this.page.locator('[data-testid="board-item"], .board-item');
      stats.boardsCount = await boards.count();

      // 统计聊天会话数量
      await this.page.goto('/ai-chat');
      await this.page.waitForLoadState('networkidle');
      const sessions = this.page.locator('[data-testid="chat-session"], .chat-session');
      stats.chatSessionsCount = await sessions.count();
    } catch (error) {
      console.warn('Failed to get test data stats:', error);
    }

    return stats;
  }
}

// 预定义测试数据集
export const TEST_DATA_SETS = {
  SAMPLE_NOTES: [
    {
      title: 'E2E测试笔记1',
      content: '这是第一个测试笔记，用于验证创建功能。',
      tags: ['测试', 'E2E'],
      category: '测试'
    },
    {
      title: 'E2E测试笔记2',
      content: '这是第二个测试笔记，包含更多内容用于验证搜索功能。内容包括各种关键词和标签。',
      tags: ['测试', '搜索', '验证'],
      category: '测试'
    }
  ],

  SAMPLE_CHAT_MESSAGES: [
    { content: '你好，这是一个测试消息', role: 'user' as const },
    { content: '您好！我是AI助手，很高兴为您服务。', role: 'assistant' as const },
    { content: '请帮我总结一下今天的工作', role: 'user' as const },
    { content: '好的，我需要更多信息来帮您总结工作内容。', role: 'assistant' as const }
  ],

  SAMPLE_KANBAN_BOARD: {
    name: 'E2E测试看板',
    description: '用于端到端测试的示例看板',
    columns: [
      {
        name: '待办',
        cards: [
          { title: '任务1', description: '测试任务描述1' },
          { title: '任务2', description: '测试任务描述2' }
        ]
      },
      {
        name: '进行中',
        cards: [
          { title: '任务3', description: '测试任务描述3' }
        ]
      },
      {
        name: '已完成',
        cards: []
      }
    ]
  },

  SAMPLE_POMODORO_SESSION: {
    duration: 25,
    breakDuration: 5,
    completed: false
  }
};