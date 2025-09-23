#!/bin/bash
# AI工作台项目 - 环境检查脚本 (Linux/Mac版本)
# 强制执行CLAUDE.md中的铁律检查清单

echo "========================================="
echo "🔴 AI工作台项目铁律检查清单"
echo "========================================="
echo ""

echo "🐍 检查Python虚拟环境状态..."
if [ -z "$VIRTUAL_ENV" ]; then
    echo "❌ 错误: Python虚拟环境未激活！"
    echo ""
    echo "🔧 请先激活虚拟环境:"
    echo "   cd backend"
    echo "   source venv/bin/activate"
    echo ""
    echo "🚨 违反铁律: 所有Python操作必须在虚拟环境中进行"
    exit 1
else
    echo "✅ Python虚拟环境已激活: $VIRTUAL_ENV"
fi

echo ""
echo "🌿 检查Git仓库状态..."
if ! git status &> /dev/null; then
    echo "❌ 错误: 当前目录不是Git仓库"
    exit 1
else
    echo "✅ Git仓库状态正常"
fi

echo ""
echo "📝 检查关键文件存在性..."
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ 错误: CLAUDE.md文件不存在"
    exit 1
else
    echo "✅ CLAUDE.md存在"
fi

if [ ! -f "TODOS.md" ]; then
    echo "❌ 错误: TODOS.md文件不存在"
    exit 1
else
    echo "✅ TODOS.md存在"
fi

if [ ! -f "README.md" ]; then
    echo "❌ 错误: README.md文件不存在"
    exit 1
else
    echo "✅ README.md存在"
fi

echo ""
echo "🎯 检查当前Git分支..."
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo "⚠️  警告: 当前在$CURRENT_BRANCH分支，建议切换到feature分支进行开发"
fi

echo ""
echo "========================================="
echo "✅ 环境检查完成"
echo "========================================="
echo ""
echo "📋 铁律提醒:"
echo "  🐍 Python虚拟环境: 已激活"
echo "  🌿 Git分支管理: 请注意分支策略"
echo "  📝 文档同步: 代码变更后及时更新文档"
echo ""