# 项目管理看板功能架构设计

## 1. 数据库模型设计

### 1.1 看板表 (boards)
```sql
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    background_color VARCHAR(7) DEFAULT '#ffffff',
    is_archived BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 列表表 (lists)
```sql
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 卡片表 (cards)
```sql
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    due_date TIMESTAMP,
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent
    color VARCHAR(7), -- 标签颜色
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 2. RESTful API设计

### 2.1 看板管理
```
GET    /api/boards                    # 获取用户所有看板
POST   /api/boards                    # 创建新看板
GET    /api/boards/{board_id}         # 获取看板详情
PUT    /api/boards/{board_id}         # 更新看板
DELETE /api/boards/{board_id}         # 删除看板
PUT    /api/boards/{board_id}/archive # 归档看板
```

### 2.2 列表管理
```
GET    /api/boards/{board_id}/lists   # 获取看板所有列表
POST   /api/boards/{board_id}/lists   # 创建新列表
PUT    /api/lists/{list_id}           # 更新列表
DELETE /api/lists/{list_id}           # 删除列表
PUT    /api/lists/{list_id}/reorder   # 重新排序列表
```

### 2.3 卡片管理
```
GET    /api/lists/{list_id}/cards     # 获取列表所有卡片
POST   /api/lists/{list_id}/cards     # 创建新卡片
PUT    /api/cards/{card_id}            # 更新卡片
DELETE /api/cards/{card_id}            # 删除卡片
PUT    /api/cards/{card_id}/move       # 移动卡片到其他列表
PUT    /api/cards/{card_id}/reorder    # 重新排序卡片
```

## 3. 前端组件架构

### 3.1 页面结构
```
src/app/boards/
├── page.tsx                    # 看板列表页面
├── [boardId]/
│   ├── page.tsx               # 看板详情页面
│   ├── loading.tsx            # 加载状态
│   └── error.tsx              # 错误处理
```

### 3.2 组件架构
```
src/components/board/
├── BoardList.tsx              # 看板列表组件
├── BoardView.tsx              # 看板视图组件
├── ListColumn.tsx             # 列表列组件
├── CardItem.tsx               # 卡片项组件
├── CardModal.tsx              # 卡片详情模态框
├── BoardHeader.tsx            # 看板头部组件
└── BoardSettings.tsx          # 看板设置组件
```

### 3.3 状态管理 (Zustand)
```typescript
interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  lists: List[];
  cards: Card[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBoards: () => Promise<void>;
  createBoard: (data: CreateBoardData) => Promise<void>;
  updateBoard: (id: string, data: UpdateBoardData) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  fetchBoardData: (boardId: string) => Promise<void>;
  createList: (boardId: string, data: CreateListData) => Promise<void>;
  updateList: (id: string, data: UpdateListData) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  reorderLists: (listIds: string[]) => Promise<void>;

  createCard: (listId: string, data: CreateCardData) => Promise<void>;
  updateCard: (id: string, data: UpdateCardData) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, targetListId: string, position: number) => Promise<void>;
  reorderCards: (listId: string, cardIds: string[]) => Promise<void>;
}
```

## 4. 拖拽交互实现方案

### 4.1 使用 @dnd-kit 库
```typescript
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';

// 拖拽事件处理
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  // 处理卡片在不同列表间的移动
  if (active.id !== over.id) {
    const activeListId = findListIdByCardId(active.id as string);
    const overListId = findListIdByCardId(over.id as string);

    if (activeListId !== overListId) {
      // 跨列表移动
      moveCard(active.id as string, overListId, calculateNewPosition(over.id as string));
    } else {
      // 列表内重排序
      reorderCards(activeListId, calculateNewOrder(active.id as string, over.id as string));
    }
  }
};
```

### 4.2 拖拽视觉反馈
- 拖拽时半透明预览效果
- 目标位置高亮显示
- 实时位置指示器
- 平滑动画过渡

## 5. 测试策略

### 5.1 后端测试 (pytest)
```python
# tests/test_board_api.py
def test_create_board_success(client, auth_headers):
    """测试创建看板成功"""
    response = client.post('/api/boards',
                          json={'name': 'Test Board', 'description': 'Test'},
                          headers=auth_headers)
    assert response.status_code == 201
    assert response.json()['data']['name'] == 'Test Board'

def test_board_crud_operations(client, auth_headers):
    """测试看板CRUD操作"""
    # Create
    response = client.post('/api/boards',
                          json={'name': 'CRUD Test'},
                          headers=auth_headers)
    board_id = response.json()['data']['id']

    # Read
    response = client.get(f'/api/boards/{board_id}', headers=auth_headers)
    assert response.status_code == 200

    # Update
    response = client.put(f'/api/boards/{board_id}',
                         json={'name': 'Updated Board'},
                         headers=auth_headers)
    assert response.status_code == 200

    # Delete
    response = client.delete(f'/api/boards/{board_id}', headers=auth_headers)
    assert response.status_code == 204
```

### 5.2 前端测试 (Jest + React Testing Library)
```typescript
// tests/components/BoardView.test.tsx
describe('BoardView Component', () => {
  it('should render board with lists and cards', async () => {
    const mockBoardData = {
      id: 'board-1',
      name: 'Test Board',
      lists: [
        {
          id: 'list-1',
          name: 'To Do',
          cards: [{ id: 'card-1', title: 'Test Card' }]
        }
      ]
    };

    render(<BoardView boardId="board-1" />);

    expect(screen.getByText('Test Board')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should handle card drag and drop', async () => {
    // 拖拽测试实现
  });
});
```

### 5.3 E2E测试 (Playwright)
```typescript
// tests/e2e/board.spec.ts
test('complete board workflow', async ({ page }) => {
  // 登录
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 创建看板
  await page.goto('/boards');
  await page.click('button:has-text("新建看板")');
  await page.fill('input[name="name"]', 'Project Board');
  await page.click('button:has-text("创建")');

  // 创建列表
  await page.click('button:has-text("添加列表")');
  await page.fill('input[placeholder="输入列表名称"]', 'To Do');
  await page.keyboard.press('Enter');

  // 创建卡片
  await page.click('button:has-text("添加卡片")');
  await page.fill('textarea[placeholder="输入卡片标题"]', 'New Task');
  await page.keyboard.press('Enter');

  // 验证结果
  await expect(page.locator('text=Project Board')).toBeVisible();
  await expect(page.locator('text=To Do')).toBeVisible();
  await expect(page.locator('text=New Task')).toBeVisible();
});
```

## 6. 开发排期 (TDD模式)

### 阶段1：数据库模型和基础API (4小时)
- [ ] 1.1 创建数据库模型 (1小时)
- [ ] 1.2 编写模型测试用例 (1小时)
- [ ] 1.3 实现基础CRUD API (1.5小时)
- [ ] 1.4 API集成测试 (0.5小时)

### 阶段2：前端基础组件 (6小时)
- [ ] 2.1 看板列表页面 (1.5小时)
- [ ] 2.2 看板视图组件 (1.5小时)
- [ ] 2.3 列表列组件 (1小时)
- [ ] 2.4 卡片组件 (1小时)
- [ ] 2.5 基础组件测试 (1小时)

### 阶段3：拖拽功能实现 (4小时)
- [ ] 3.1 @dnd-kit集成配置 (0.5小时)
- [ ] 3.2 列表拖拽重排序 (1.5小时)
- [ ] 3.3 卡片跨列表拖拽 (1.5小时)
- [ ] 3.4 拖拽功能测试 (0.5小时)

### 阶段4：高级功能和优化 (4小时)
- [ ] 4.1 卡片详情模态框 (1小时)
- [ ] 4.2 看板设置功能 (1小时)
- [ ] 4.3 响应式布局适配 (1小时)
- [ ] 4.4 性能优化和错误处理 (1小时)

### 阶段5：集成测试和文档 (2小时)
- [ ] 5.1 E2E测试用例 (1小时)
- [ ] 5.2 性能测试 (0.5小时)
- [ ] 5.3 文档更新 (0.5小时)

**总计：20小时 (2.5个工作日)**

## 7. 技术关键点

### 7.1 性能优化
- 虚拟滚动处理大量卡片
- 拖拽防抖优化
- 数据分页加载
- 缓存策略

### 7.2 实时同步
- WebSocket连接支持协作
- 操作冲突处理
- 离线数据同步

### 7.3 安全性
- 权限验证（用户只能访问自己的看板）
- 输入验证和SQL注入防护
- XSS攻击防护

## 8. 风险评估

### 8.1 高风险项
1. **拖拽性能** - 大量卡片拖拽可能卡顿
2. **实时同步** - 多人协作时数据冲突
3. **移动端适配** - 拖拽在触屏设备上的体验

### 8.2 缓解措施
1. 实现虚拟滚动和懒加载
2. 采用OT算法处理协作冲突
3. 移动端特殊交互优化