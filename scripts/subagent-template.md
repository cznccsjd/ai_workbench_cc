# Sub Agent调度铁律模板

## 🔴 Sub Agent调度前强制检查清单

每次调度Sub Agent前，项目经理必须在prompt开头包含以下铁律提醒：

```
⚠️ 铁律检查清单 - 在开始任何工作前，请务必确认：

🐍 Python虚拟环境铁律：
- [ ] 所有Python命令前必须先激活虚拟环境
- [ ] Windows: cd backend && venv\Scripts\activate
- [ ] Linux/Mac: cd backend && source venv/bin/activate
- [ ] 验证: 确认命令行显示(venv)前缀

🌿 Git管理铁律：
- [ ] 确认当前在正确的分支 (feature/xxx)
- [ ] 提交信息遵循Conventional Commits规范
- [ ] 变更后及时推送到GitHub

📝 文档更新铁律：
- [ ] 代码变更必须同步更新相关文档
- [ ] 完成后必须更新TODOS.md状态
- [ ] 重大变更必须更新README.md

请在执行任何Python操作前明确确认虚拟环境已激活。
```

## 标准Sub Agent调度模板

### 模板结构：
1. 铁律检查清单 (强制)
2. 任务描述
3. 具体要求
4. 预期输出
5. 铁律执行验证

### 示例：
```
⚠️ 铁律检查清单 - 在开始任何工作前，请务必确认：
[铁律检查清单内容]

作为[角色名称]，请[具体任务描述]。

具体要求：
1. [要求1]
2. [要求2]

重要提醒：
- 所有Python命令必须在虚拟环境中执行
- 代码变更后必须更新相关文档
- 完成后确认Git提交规范

请确认已完成铁律检查后开始工作。
```