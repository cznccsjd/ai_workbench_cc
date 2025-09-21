// AI记事本端到端测试
// 使用Playwright测试完整的用户流程

import { test, expect, Page } from '@playwright/test';
import { AIWorkbenchPage } from '../pages/AIWorkbenchPage';
import { AINotepadPage } from '../pages/AINotepadPage';

test.describe('AI记事本端到端测试', () => {
  let aiWorkbench: AIWorkbenchPage;
  let aiNotepad: AINotepadPage;

  test.beforeEach(async ({ page }) => {
    // 初始化页面对象
    aiWorkbench = new AIWorkbenchPage(page);
    aiNotepad = new AINotepadPage(page);

    // 导航到AI记事本页面
    await aiWorkbench.goto();
    await aiWorkbench.navigateToAINotepad();
  });

  test('用户应该能够创建新笔记', async ({ page }) => {
    await test.step('创建新笔记', async () => {
      await aiNotepad.createNewNote();

      // 验证新笔记被创建
      await expect(aiNotepad.getNoteTitleInput()).toBeVisible();
      await expect(aiNotepad.getNoteContentTextarea()).toBeVisible();

      // 验证默认标题包含时间戳
      const titleValue = await aiNotepad.getNoteTitleInput().inputValue();
      expect(titleValue).toContain('新笔记');
    });
  });

  test('用户应该能够编辑笔记内容', async ({ page }) => {
    await test.step('创建并编辑笔记', async () => {
      await aiNotepad.createNewNote();

      const testTitle = '测试笔记标题';
      const testContent = '# 测试标题\n\n这是测试内容，包含一些**粗体**和*斜体*文本。';

      await aiNotepad.editNoteTitle(testTitle);
      await aiNotepad.editNoteContent(testContent);

      // 验证内容被正确输入
      await expect(aiNotepad.getNoteTitleInput()).toHaveValue(testTitle);
      await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(testContent);

      // 验证字数统计
      await expect(aiNotepad.getWordCount()).toContainText('字');
      await expect(aiNotepad.getReadingTime()).toContainText('约');
    });
  });

  test('用户应该能够使用AI整理功能', async ({ page }) => {
    await test.step('创建笔记并使用AI整理', async () => {
      await aiNotepad.createNewNote();

      const messyContent = '今天开会讨论了项目进展张三负责前端开发李四负责后端开发王五负责测试我们需要在下周完成第一阶段的开发任务记得要提交代码审查';
      await aiNotepad.editNoteContent(messyContent);

      await aiNotepad.organizeNoteWithAI();

      // 验证AI处理指示器出现
      await expect(aiNotepad.getAIProcessingIndicator()).toBeVisible();

      // 等待AI处理完成
      await aiNotepad.waitForAIProcessingToComplete();

      // 验证内容被整理（应该包含更好的格式）
      const organizedContent = await aiNotepad.getNoteContentTextarea().inputValue();
      expect(organizedContent.length).toBeGreaterThan(messyContent.length);

      // 验证内容包含结构化元素
      expect(organizedContent).toMatch(/[，。]/); // 应该包含中文标点
    });
  });

  test('用户应该能够使用AI提取Todo功能', async ({ page }) => {
    await test.step('创建包含任务的笔记并提取Todo', async () => {
      await aiNotepad.createNewNote();

      const contentWithTasks = '项目会议纪要：\n\n1. 张三需要在下周一完成前端页面开发\n2. 李四负责后端API接口，预计本周内完成\n3. 王五要进行系统测试，确保质量\n4. 产品经理准备用户手册\n\n请大家按时完成任务。';
      await aiNotepad.editNoteContent(contentWithTasks);

      await aiNotepad.extractTodosFromNote();

      // 验证AI处理指示器出现
      await expect(aiNotepad.getAIProcessingIndicator()).toBeVisible();

      // 等待AI处理完成
      await aiNotepad.waitForAIProcessingToComplete();

      // 验证Todo被提取到右侧面板
      await expect(aiNotepad.getTodoPanel()).toBeVisible();

      // 验证至少有一个Todo被创建
      const todoCount = await aiNotepad.getTodoCount();
      expect(todoCount).toBeGreaterThan(0);
    });
  });

  test('用户应该能够管理Todo项目', async ({ page }) => {
    await test.step('创建笔记、提取Todo并管理它们', async () => {
      await aiNotepad.createNewNote();

      const contentWithTasks = '今日任务：完成测试用例编写、提交代码审查、更新项目文档。';
      await aiNotepad.editNoteContent(contentWithTasks);

      // 提取Todo
      await aiNotepad.extractTodosFromNote();
      await aiNotepad.waitForAIProcessingToComplete();

      // 获取Todo列表
      const todos = await aiNotepad.getAllTodos();
      expect(todos.length).toBeGreaterThan(0);

      // 完成第一个Todo
      if (todos.length > 0) {
        await aiNotepad.toggleTodoCompletion(todos[0]);

        // 验证Todo状态被更新
        await expect(aiNotepad.isTodoCompleted(todos[0])).toBeTruthy();
      }
    });
  });

  test('用户应该能够在笔记间切换', async ({ page }) => {
    await test.step('创建多个笔记并切换', async () => {
      // 创建第一个笔记
      await aiNotepad.createNewNote();
      const firstNoteTitle = '第一个笔记';
      const firstNoteContent = '这是第一个笔记的内容。';
      await aiNotepad.editNoteTitle(firstNoteTitle);
      await aiNotepad.editNoteContent(firstNoteContent);

      // 创建第二个笔记
      await aiNotepad.createNewNote();
      const secondNoteTitle = '第二个笔记';
      const secondNoteContent = '这是第二个笔记的内容。';
      await aiNotepad.editNoteTitle(secondNoteTitle);
      await aiNotepad.editNoteContent(secondNoteContent);

      // 切换回第一个笔记
      await aiNotepad.selectNoteByTitle(firstNoteTitle);

      // 验证当前显示的是第一个笔记
      await expect(aiNotepad.getNoteTitleInput()).toHaveValue(firstNoteTitle);
      await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(firstNoteContent);

      // 切换到第二个笔记
      await aiNotepad.selectNoteByTitle(secondNoteTitle);

      // 验证当前显示的是第二个笔记
      await expect(aiNotepad.getNoteTitleInput()).toHaveValue(secondNoteTitle);
      await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(secondNoteContent);
    });
  });

  test('用户应该能够搜索笔记', async ({ page }) => {
    await test.step('创建多个笔记并搜索', async () => {
      // 创建测试笔记
      const testNotes = [
        { title: 'Python编程指南', content: 'Python是一种强大的编程语言' },
        { title: 'JavaScript开发', content: 'JavaScript用于前端开发' },
        { title: 'Python数据分析', content: '使用Python进行数据分析' },
      ];

      for (const noteData of testNotes) {
        await aiNotepad.createNewNote();
        await aiNotepad.editNoteTitle(noteData.title);
        await aiNotepad.editNoteContent(noteData.content);
      }

      // 搜索包含"Python"的笔记
      await aiNotepad.searchNotes('Python');

      // 验证搜索结果
      const searchResults = await aiNotepad.getSearchResults();
      expect(searchResults.length).toBe(2); // 应该找到2个包含Python的笔记
      expect(searchResults.some(note => note.includes('Python编程'))).toBeTruthy();
      expect(searchResults.some(note => note.includes('Python数据'))).toBeTruthy();
    });
  });

  test('用户应该能够收藏笔记', async ({ page }) => {
    await test.step('创建笔记并收藏', async () => {
      await aiNotepad.createNewNote();
      await aiNotepad.editNoteTitle('收藏测试笔记');
      await aiNotepad.editNoteContent('这是一个需要收藏的笔记。');

      // 收藏笔记
      await aiNotepad.toggleBookmark();

      // 验证收藏状态
      await expect(aiNotepad.isNoteBookmarked()).toBeTruthy();

      // 取消收藏
      await aiNotepad.toggleBookmark();

      // 验证取消收藏
      await expect(aiNotepad.isNoteBookmarked()).toBeFalsy();
    });
  });

  test('用户应该能够使用Markdown格式化', async ({ page }) => {
    await test.step('创建笔记并使用Markdown格式化', async () => {
      await aiNotepad.createNewNote();
      await aiNotepad.editNoteContent('测试文本');

      // 选中"测试"文本
      await aiNotepad.selectTextInEditor('测试', 0);

      // 应用粗体格式
      await aiNotepad.applyBoldFormatting();

      // 验证粗体格式被应用
      const content = await aiNotepad.getNoteContentTextarea().inputValue();
      expect(content).toContain('**测试**');

      // 应用斜体格式
      await aiNotepad.selectTextInEditor('文本', 6);
      await aiNotepad.applyItalicFormatting();

      const updatedContent = await aiNotepad.getNoteContentTextarea().inputValue();
      expect(updatedContent).toContain('*文本*');
    });
  });

  test('用户应该能够在编辑和预览模式间切换', async ({ page }) => {
    await test.step('创建笔记并切换编辑/预览模式', async () => {
      await aiNotepad.createNewNote();

      const markdownContent = '# 主标题\n\n## 副标题\n\n**粗体文本** *斜体文本*\n\n- 列表项1\n- 列表项2\n\n[链接文本](https://example.com)';
      await aiNotepad.editNoteContent(markdownContent);

      // 切换到预览模式
      await aiNotepad.switchToPreviewMode();

      // 验证预览模式下的渲染
      await expect(aiNotepad.getPreviewPanel()).toBeVisible();
      await expect(aiNotepad.getRenderedHeading('主标题')).toBeVisible();
      await expect(aiNotepad.getRenderedHeading('副标题')).toBeVisible();
      await expect(aiNotepad.getRenderedBoldText('粗体文本')).toBeVisible();
      await expect(aiNotepad.getRenderedItalicText('斜体文本')).toBeVisible();
      await expect(aiNotepad.getRenderedLink('链接文本')).toBeVisible();

      // 切换回编辑模式
      await aiNotepad.switchToEditMode();

      // 验证编辑模式
      await expect(aiNotepad.getNoteContentTextarea()).toBeVisible();
      await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(markdownContent);
    });
  });

  test('错误处理和恢复机制', async ({ page }) => {
    await test.step('测试错误处理和恢复', async () => {
      await aiNotepad.createNewNote();

      // 模拟网络错误（可以通过网络拦截或模拟慢速网络）
      await page.route('**/api/notes/*/organize', route => {
        route.abort('failed');
      });

      await aiNotepad.editNoteContent('测试内容');
      await aiNotepad.organizeNoteWithAI();

      // 验证错误提示出现
      await expect(aiNotepad.getErrorMessage()).toBeVisible();

      // 关闭错误提示
      await aiNotepad.closeErrorMessage();

      // 验证错误提示被关闭
      await expect(aiNotepad.getErrorMessage()).not.toBeVisible();
    });
  });

  test('响应式布局和移动设备适配', async ({ page }) => {
    await test.step('测试响应式布局', async () => {
      // 测试桌面布局
      await page.setViewportSize({ width: 1920, height: 1080 });
      await aiNotepad.createNewNote();

      // 验证三栏布局在桌面端显示
      await expect(aiNotepad.getLeftPanel()).toBeVisible();
      await expect(aiNotepad.getCenterPanel()).toBeVisible();
      await expect(aiNotepad.getRightPanel()).toBeVisible();

      // 测试平板布局
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500); // 等待布局调整

      // 验证布局适配
      await expect(aiNotepad.getLeftPanel()).toBeVisible();
      await expect(aiNotepad.getCenterPanel()).toBeVisible();

      // 测试手机布局
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500); // 等待布局调整

      // 验证移动端布局
      await expect(aiNotepad.getMobileLayout()).toBeVisible();
    });
  });

  test('键盘快捷键支持', async ({ page }) => {
    await test.step('测试键盘快捷键', async () => {
      await aiNotepad.createNewNote();

      const testContent = '快捷键测试内容';
      await aiNotepad.editNoteContent(testContent);

      // 测试全选快捷键
      await page.keyboard.press('Control+KeyA');

      // 测试复制快捷键
      await page.keyboard.press('Control+KeyC');

      // 移动到内容末尾
      await page.keyboard.press('End');

      // 测试粘贴快捷键
      await page.keyboard.press('Control+KeyV');

      // 验证内容被复制粘贴
      const finalContent = await aiNotepad.getNoteContentTextarea().inputValue();
      expect(finalContent).toContain(testContent + testContent);
    });
  });

  test('数据持久化和恢复', async ({ page }) => {
    await test.step('测试数据持久化', async () => {
      await aiNotepad.createNewNote();

      const testTitle = '持久化测试笔记';
      const testContent = '这个笔记应该被保存并在页面刷新后恢复。';

      await aiNotepad.editNoteTitle(testTitle);
      await aiNotepad.editNoteContent(testContent);

      // 等待数据保存（可能需要一些时间）
      await page.waitForTimeout(2000);

      // 刷新页面
      await page.reload();

      // 等待页面加载
      await aiNotepad.waitForPageLoad();

      // 选择刚才创建的笔记
      await aiNotepad.selectNoteByTitle(testTitle);

      // 验证数据被恢复
      await expect(aiNotepad.getNoteTitleInput()).toHaveValue(testTitle);
      await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(testContent);
    });
  });

  test('性能测试 - 大内容处理', async ({ page }) => {
    await test.step('测试大内容处理性能', async () => {
      await aiNotepad.createNewNote();

      // 创建大内容（约100KB）
      const largeContent = '大量内容 '.repeat(5000);

      const startTime = Date.now();
      await aiNotepad.editNoteContent(largeContent);
      const inputTime = Date.now() - startTime;

      // 验证输入性能（应该小于5秒）
      expect(inputTime).toBeLessThan(5000);

      // 测试大内容的字数统计
      await expect(aiNotepad.getWordCount()).toContainText('10000');

      // 测试预览模式下的渲染性能
      const previewStartTime = Date.now();
      await aiNotepad.switchToPreviewMode();
      const previewTime = Date.now() - previewStartTime;

      // 验证预览渲染性能（应该小于3秒）
      expect(previewTime).toBeLessThan(3000);
    });
  });
});

test.describe('AI记事本边界情况测试', () => {
  let aiNotepad: AINotepadPage;

  test.beforeEach(async ({ page }) => {
    aiNotepad = new AINotepadPage(page);
    await aiNotepad.goto();
  });

  test('空内容处理', async ({ page }) => {
    await aiNotepad.createNewNote();

    // 不输入任何内容，直接测试功能
    await aiNotepad.organizeNoteWithAI();
    await aiNotepad.waitForAIProcessingToComplete();

    // 验证不会出现错误
    await expect(aiNotepad.getErrorMessage()).not.toBeVisible();
  });

  test('特殊字符处理', async ({ page }) => {
    await aiNotepad.createNewNote();

    const specialContent = '特殊字符测试：<>"\'&©®™😀🎉';
    await aiNotepad.editNoteContent(specialContent);

    // 验证特殊字符被正确处理
    await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(specialContent);
  });

  test('并发操作处理', async ({ page }) => {
    await aiNotepad.createNewNote();

    const content = '测试并发操作的内容';
    await aiNotepad.editNoteContent(content);

    // 同时触发多个AI操作
    await Promise.all([
      aiNotepad.organizeNoteWithAI(),
      aiNotepad.extractTodosFromNote()
    ]);

    // 验证两个操作都能完成
    await aiNotepad.waitForAIProcessingToComplete();
  });

  test('长标题处理', async ({ page }) => {
    await aiNotepad.createNewNote();

    const longTitle = '这是一个非常长的标题，用于测试系统对长标题的处理能力，确保不会出现问题或截断';
    await aiNotepad.editNoteTitle(longTitle);

    // 验证长标题被正确处理
    await expect(aiNotepad.getNoteTitleInput()).toHaveValue(longTitle);
  });

  test('快速切换笔记', async ({ page }) => {
    // 创建多个笔记
    const notes = [];
    for (let i = 0; i < 5; i++) {
      await aiNotepad.createNewNote();
      const title = `快速切换测试笔记${i}`;
      const content = `这是第${i}个测试笔记的内容`;
      await aiNotepad.editNoteTitle(title);
      await aiNotepad.editNoteContent(content);
      notes.push({ title, content });
    }

    // 快速连续切换笔记
    for (const note of notes) {
      await aiNotepad.selectNoteByTitle(note.title);
      await expect(aiNotepad.getNoteTitleInput()).toHaveValue(note.title);
      await expect(aiNotepad.getNoteContentTextarea()).toHaveValue(note.content);
    }
  });
});