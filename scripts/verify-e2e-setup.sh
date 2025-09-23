#!/bin/bash

# E2E测试环境验证脚本
# 用于验证E2E测试环境是否正确配置

echo "🚀 AI工作台 E2E测试环境验证"
echo "=================================="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 错误计数
ERROR_COUNT=0

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        ((ERROR_COUNT++))
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 存在"
        return 0
    else
        echo -e "${RED}✗${NC} $1 不存在"
        ((ERROR_COUNT++))
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 目录存在"
        return 0
    else
        echo -e "${RED}✗${NC} $1 目录不存在"
        ((ERROR_COUNT++))
        return 1
    fi
}

check_service() {
    local url=$1
    local name=$2
    local timeout=30
    local count=0

    echo -e "${BLUE}🔍${NC} 检查 $name 服务: $url"

    while [ $count -lt $timeout ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} $name 服务运行正常"
            return 0
        fi
        sleep 1
        ((count++))
    done

    echo -e "${RED}✗${NC} $name 服务不可访问"
    ((ERROR_COUNT++))
    return 1
}

# 1. 检查系统依赖
echo -e "\n${BLUE}📋 检查系统依赖${NC}"
echo "-------------------"
check_command "node"
check_command "npm"
check_command "python"
check_command "pip"

# 检查Node.js版本
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ $NODE_MAJOR -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js 版本 $NODE_VERSION (>= 18)"
    else
        echo -e "${RED}✗${NC} Node.js 版本 $NODE_VERSION (需要 >= 18)"
        ((ERROR_COUNT++))
    fi
fi

# 检查Python版本
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    if [ $PYTHON_MAJOR -eq 3 ] && [ $PYTHON_MINOR -ge 11 ]; then
        echo -e "${GREEN}✓${NC} Python 版本 $PYTHON_VERSION (>= 3.11)"
    else
        echo -e "${RED}✗${NC} Python 版本 $PYTHON_VERSION (需要 >= 3.11)"
        ((ERROR_COUNT++))
    fi
fi

# 2. 检查项目结构
echo -e "\n${BLUE}📁 检查项目结构${NC}"
echo "-------------------"
check_directory "frontend"
check_directory "backend"
check_directory "e2e"
check_directory "e2e/pages"
check_directory "e2e/tests"
check_directory "e2e/utils"

# 3. 检查配置文件
echo -e "\n${BLUE}⚙️ 检查配置文件${NC}"
echo "-------------------"
check_file "playwright.config.ts"
check_file "e2e/global-setup.ts"
check_file "e2e/global-teardown.ts"
check_file "frontend/package.json"
check_file "backend/requirements.txt"

# 4. 检查E2E测试文件
echo -e "\n${BLUE}🧪 检查E2E测试文件${NC}"
echo "--------------------"
check_file "e2e/pages/AIWorkbenchPage.ts"
check_file "e2e/pages/AINotepadPage.ts"
check_file "e2e/pages/AIChatPage.ts"
check_file "e2e/pages/PomodoroPage.ts"
check_file "e2e/utils/auth.ts"
check_file "e2e/utils/test-data.ts"
check_file "e2e/utils/test-env.ts"
check_file "e2e/tests/auth/authentication.spec.ts"
check_file "e2e/tests/ai-notepad.spec.ts"
check_file "e2e/tests/ai-chat.spec.ts"
check_file "e2e/tests/pomodoro.spec.ts"

# 5. 检查依赖安装
echo -e "\n${BLUE}📦 检查依赖安装${NC}"
echo "-------------------"

# 检查前端依赖
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 前端依赖已安装"
else
    echo -e "${YELLOW}⚠${NC} 前端依赖未安装，正在安装..."
    cd frontend && npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} 前端依赖安装成功"
    else
        echo -e "${RED}✗${NC} 前端依赖安装失败"
        ((ERROR_COUNT++))
    fi
    cd ..
fi

# 检查后端依赖
if [ -d "backend/venv" ] || python -c "import uvicorn" &> /dev/null; then
    echo -e "${GREEN}✓${NC} 后端依赖已安装"
else
    echo -e "${YELLOW}⚠${NC} 后端依赖可能未安装"
    echo "请运行: cd backend && pip install -r requirements.txt"
fi

# 检查Playwright浏览器
if [ -d "$HOME/.cache/ms-playwright" ] || [ -d "ms-playwright" ]; then
    echo -e "${GREEN}✓${NC} Playwright 浏览器已安装"
else
    echo -e "${YELLOW}⚠${NC} Playwright 浏览器未安装，正在安装..."
    npx playwright install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Playwright 浏览器安装成功"
    else
        echo -e "${RED}✗${NC} Playwright 浏览器安装失败"
        ((ERROR_COUNT++))
    fi
fi

# 6. 启动服务并检查
echo -e "\n${BLUE}🚀 启动并检查服务${NC}"
echo "--------------------"

# 启动后端服务
echo "正在启动后端服务..."
cd backend
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
cd ..

# 启动前端服务
echo "正在启动前端服务..."
cd frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
cd ..

# 等待服务启动
sleep 10

# 检查服务状态
check_service "http://localhost:8000/health" "后端API"
check_service "http://localhost:3000" "前端应用"

# 7. 运行快速测试
echo -e "\n${BLUE}⚡ 运行快速测试${NC}"
echo "------------------"

# 运行设置测试
echo "运行测试环境设置..."
npx playwright test e2e/tests/setup/test-setup.setup.ts --project=chromium
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 测试环境设置成功"
else
    echo -e "${RED}✗${NC} 测试环境设置失败"
    ((ERROR_COUNT++))
fi

# 运行一个简单的测试
echo "运行基础认证测试..."
npx playwright test e2e/tests/auth/authentication.spec.ts --project=chromium --grep="应该显示登录页面"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 基础测试通过"
else
    echo -e "${YELLOW}⚠${NC} 基础测试失败（可能是正常的，取决于应用状态）"
fi

# 8. 清理服务
echo -e "\n${BLUE}🧹 清理服务${NC}"
echo "-------------"

# 停止服务
if [ -f "backend/backend.pid" ]; then
    kill $(cat backend/backend.pid) 2>/dev/null
    rm backend/backend.pid
    echo -e "${GREEN}✓${NC} 后端服务已停止"
fi

if [ -f "frontend/frontend.pid" ]; then
    kill $(cat frontend/frontend.pid) 2>/dev/null
    rm frontend/frontend.pid
    echo -e "${GREEN}✓${NC} 前端服务已停止"
fi

# 清理可能的僵尸进程
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# 9. 总结
echo -e "\n${BLUE}📊 验证总结${NC}"
echo "=============="

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 恭喜！E2E测试环境配置完全正确！${NC}"
    echo ""
    echo "可以使用以下命令运行E2E测试："
    echo "  npx playwright test                    # 运行所有测试"
    echo "  npx playwright test --ui               # 使用UI模式"
    echo "  npx playwright test --project=chromium # 仅运行Chrome测试"
    echo "  npx playwright show-report             # 查看测试报告"
else
    echo -e "${RED}❌ 发现 $ERROR_COUNT 个问题需要解决${NC}"
    echo ""
    echo "请解决上述问题后重新运行此验证脚本。"
    echo ""
    echo "常见解决方案："
    echo "  - 安装缺失的依赖: npm install / pip install -r requirements.txt"
    echo "  - 安装Playwright浏览器: npx playwright install"
    echo "  - 检查Node.js和Python版本"
    echo "  - 确保所有必需文件存在"
fi

echo ""
echo "详细日志文件："
echo "  backend/backend.log  - 后端服务日志"
echo "  frontend/frontend.log - 前端服务日志"
echo "  test-results/        - 测试结果目录"

exit $ERROR_COUNT