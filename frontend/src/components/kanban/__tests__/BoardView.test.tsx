import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BoardView from '../BoardView';
import { KanbanProvider } from '../../../contexts/KanbanContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// 模拟依赖
jest.mock('../../../contexts/KanbanContext', () => ({
  ...jest.requireActual('../../../contexts/KanbanContext'),
  useKanban: () => ({
    boards: [
      {
        id: '1',
        name: '测试看板',
        description: '测试描述',
        background_color: '#FFFFFF',
        is_archived: false,
        position: 0,
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

describe('BoardView', () => {
  const renderBoardView = () => {
    return render(
      <ThemeProvider>
        <KanbanProvider>
          <BoardView />
        </KanbanProvider>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('应该正确渲染看板列表', () => {
      renderBoardView();

      expect(screen.getByText('测试看板')).toBeInTheDocument();
      expect(screen.getByText('测试描述')).toBeInTheDocument();
    });

    it('应该显示创建看板按钮', () => {
      renderBoardView();

      expect(screen.getByRole('button', { name: /创建看板/i })).toBeInTheDocument();
    });

    it('应该在加载状态显示加载器', () => {
      jest.mock('../../../contexts/KanbanContext', () => ({
        ...jest.requireActual('../../../contexts/KanbanContext'),
        useKanban: () => ({
          boards: [],
          loading: true,
          error: null,
          fetchBoards: jest.fn(),
          createBoard: jest.fn(),
          updateBoard: jest.fn(),
          deleteBoard: jest.fn()
        })
      }));

      renderBoardView();

      expect(screen.getByText(/加载中/i)).toBeInTheDocument();
    });

    it('应该在错误状态显示错误信息', () => {
      jest.mock('../../../contexts/KanbanContext', () => ({
        ...jest.requireActual('../../../contexts/KanbanContext'),
        useKanban: () => ({
          boards: [],
          loading: false,
          error: '加载失败',
          fetchBoards: jest.fn(),
          createBoard: jest.fn(),
          updateBoard: jest.fn(),
          deleteBoard: jest.fn()
        })
      }));

      renderBoardView();

      expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('应该打开创建看板模态框', async () => {
      renderBoardView();

      const createButton = screen.getByRole('button', { name: /创建看板/i });
      await userEvent.click(createButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/创建新看板/i)).toBeInTheDocument();
    });

    it('应该处理看板点击事件', async () => {
      const mockPush = jest.fn();
      jest.mock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush
        })
      }));

      renderBoardView();

      const boardCard = screen.getByText('测试看板').closest('div[role="button"]');
      if (boardCard) {
        await userEvent.click(boardCard);
        expect(mockPush).toHaveBeenCalledWith('/boards/1');
      }
    });
  });

  describe('响应式测试', () => {
    it('应该在移动设备上正确显示', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderBoardView();

      const boardGrid = screen.getByRole('grid');
      expect(boardGrid).toHaveClass('grid-cols-1');
    });

    it('应该在桌面设备上正确显示', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      renderBoardView();

      const boardGrid = screen.getByRole('grid');
      expect(boardGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
    });
  });

  describe('主题集成测试', () => {
    it('应该应用正确的主题样式', () => {
      renderBoardView();

      const container = screen.getByRole('main');
      expect(container).toHaveClass('min-h-screen');
    });
  });
});