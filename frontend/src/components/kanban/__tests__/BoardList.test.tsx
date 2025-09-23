import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardList from '../BoardList';
import { KanbanProvider } from '../../../contexts/KanbanContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// 模拟依赖
jest.mock('../../../contexts/KanbanContext', () => ({
  ...jest.requireActual('../../../contexts/KanbanContext'),
  useKanban: () => ({
    boards: [
      {
        id: '1',
        name: '活跃看板',
        description: '活跃描述',
        background_color: '#FFFFFF',
        is_archived: false,
        position: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: '归档看板',
        description: '归档描述',
        background_color: '#F5F5F5',
        is_archived: true,
        position: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    fetchBoards: jest.fn(),
    createBoard: jest.fn(),
    updateBoard: jest.fn(),
    deleteBoard: jest.fn()
  })
}));

describe('BoardList', () => {
  const mockOnBoardSelect = jest.fn();

  const renderBoardList = (props = {}) => {
    return render(
      <ThemeProvider>
        <KanbanProvider>
          <BoardList onBoardSelect={mockOnBoardSelect} {...props} />
        </KanbanProvider>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该正确渲染看板列表', () => {
      renderBoardList();

      expect(screen.getByText('活跃看板')).toBeInTheDocument();
      expect(screen.getByText('活跃描述')).toBeInTheDocument();
    });

    it('应该显示归档看板', () => {
      renderBoardList();

      expect(screen.getByText('归档看板')).toBeInTheDocument();
    });

    it('应该显示看板背景颜色', () => {
      renderBoardList();

      const boardCards = screen.getAllByRole('article');
      expect(boardCards[0]).toHaveStyle({ backgroundColor: '#FFFFFF' });
      expect(boardCards[1]).toHaveStyle({ backgroundColor: '#F5F5F5' });
    });
  });

  describe('交互测试', () => {
    it('应该选择看板时触发回调', async () => {
      renderBoardList();

      const boardCard = screen.getByText('活跃看板').closest('article');
      if (boardCard) {
        await userEvent.click(boardCard);
        expect(mockOnBoardSelect).toHaveBeenCalledWith('1');
      }
    });

    it('应该显示看板操作菜单', async () => {
      renderBoardList();

      const menuButtons = screen.getAllByRole('button', { name: /更多操作/i });
      await userEvent.click(menuButtons[0]);

      expect(screen.getByText(/编辑/i)).toBeInTheDocument();
      expect(screen.getByText(/归档/i)).toBeInTheDocument();
      expect(screen.getByText(/删除/i)).toBeInTheDocument();
    });

    it('应该处理编辑操作', async () => {
      renderBoardList();

      const menuButtons = screen.getAllByRole('button', { name: /更多操作/i });
      await userEvent.click(menuButtons[0]);

      const editButton = screen.getByText(/编辑/i);
      await userEvent.click(editButton);

      // 这里应该验证编辑模态框是否打开
      // 具体实现取决于编辑功能的实现方式
    });

    it('应该处理归档操作', async () => {
      renderBoardList();

      const menuButtons = screen.getAllByRole('button', { name: /更多操作/i });
      await userEvent.click(menuButtons[0]);

      const archiveButton = screen.getByText(/归档/i);
      await userEvent.click(archiveButton);

      // 这里应该验证归档确认对话框是否显示
    });
  });

  describe('响应式测试', () => {
    it('应该在移动设备上正确显示', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderBoardList();

      const boardGrid = screen.getByRole('grid');
      expect(boardGrid).toHaveClass('grid-cols-1');
    });

    it('应该在桌面设备上正确显示', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      renderBoardList();

      const boardGrid = screen.getByRole('grid');
      expect(boardGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
    });
  });

  describe('主题集成测试', () => {
    it('应该应用正确的主题样式', () => {
      renderBoardList();

      const container = screen.getByRole('main');
      expect(container).toHaveClass('min-h-screen');
    });
  });

  describe('性能测试', () => {
    it('应该正确处理大量看板', () => {
      const manyBoards = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `看板 ${i}`,
        description: `描述 ${i}`,
        background_color: '#FFFFFF',
        is_archived: i % 2 === 0,
        position: i,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }));

      jest.mock('../../../contexts/KanbanContext', () => ({
        ...jest.requireActual('../../../contexts/KanbanContext'),
        useKanban: () => ({
          boards: manyBoards,
          loading: false,
          error: null,
          fetchBoards: jest.fn(),
          createBoard: jest.fn(),
          updateBoard: jest.fn(),
          deleteBoard: jest.fn()
        })
      }));

      renderBoardList();

      // 验证是否所有看板都被渲染
      expect(screen.getAllByRole('article')).toHaveLength(100);
    });
  });
});