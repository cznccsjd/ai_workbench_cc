@echo off
REM AI工作台项目 - 环境检查脚本
REM 强制执行CLAUDE.md中的铁律检查清单

echo =========================================
echo 🔴 AI工作台项目铁律检查清单
echo =========================================
echo.

echo 🐍 检查Python虚拟环境状态...
if "%VIRTUAL_ENV%"=="" (
    echo ❌ 错误: Python虚拟环境未激活！
    echo.
    echo 🔧 请先激活虚拟环境:
    echo    cd backend
    echo    venv\Scripts\activate
    echo.
    echo 🚨 违反铁律: 所有Python操作必须在虚拟环境中进行
    pause
    exit /b 1
) else (
    echo ✅ Python虚拟环境已激活: %VIRTUAL_ENV%
)

echo.
echo 🌿 检查Git仓库状态...
git status --porcelain > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 当前目录不是Git仓库
    exit /b 1
) else (
    echo ✅ Git仓库状态正常
)

echo.
echo 📝 检查关键文件存在性...
if not exist "CLAUDE.md" (
    echo ❌ 错误: CLAUDE.md文件不存在
    exit /b 1
) else (
    echo ✅ CLAUDE.md存在
)

if not exist "TODOS.md" (
    echo ❌ 错误: TODOS.md文件不存在
    exit /b 1
) else (
    echo ✅ TODOS.md存在
)

if not exist "README.md" (
    echo ❌ 错误: README.md文件不存在
    exit /b 1
) else (
    echo ✅ README.md存在
)

echo.
echo 🎯 检查当前Git分支...
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 当前分支: %CURRENT_BRANCH%

if "%CURRENT_BRANCH%"=="main" (
    echo ⚠️  警告: 当前在main分支，建议切换到feature分支进行开发
)

if "%CURRENT_BRANCH%"=="master" (
    echo ⚠️  警告: 当前在master分支，建议切换到feature分支进行开发
)

echo.
echo =========================================
echo ✅ 环境检查完成
echo =========================================
echo.
echo 📋 铁律提醒:
echo   🐍 Python虚拟环境: 已激活
echo   🌿 Git分支管理: 请注意分支策略
echo   📝 文档同步: 代码变更后及时更新文档
echo.