# notion-helper

安全的 Notion 集成工具，零外部依赖，纯 Node.js 内置模块实现，可在任意 AI 智能体中管理 Notion 工作区。

[English Documentation](./README.md)

## 功能

- 创建 Notion 页面
- 搜索、追加、移动、归档页面
- 在已授权根页面下规划并创建多级子目录
- 将 Markdown 文档渲染成更美观的 Notion 页面，而不是简单逐行转 block
- 支持通过结构化 JSON 精确控制页面版式
- 全局安装一次后，可在多个智能体中复用

## 安装

```bash
npx skills add 75002425/notion-helper -g
```

- `-g` 表示安装到当前智能体的全局技能目录
- 具体目录由 `skills` 决定，例如 `~/.claude/skills/` 或 `~/.agents/skills/`

## 升级

重复执行同一条命令即可：

```bash
npx skills add 75002425/notion-helper -g
```

`skills` 会检测已有安装，并升级到最新版本。

## 这次升级的重点

`notion-helper` 不再只是 Markdown 到 Notion block 的机械转换。现在长文档会先经过“文档设计层”，再进入 Notion 渲染层：

- Markdown 文件支持 front matter 元信息
- 会自动识别摘要、关键结论、风险、下一步、参考资料、附录等语义区块
- 支持 `note`、`research`、`meeting-notes`、`decision-log`、`weekly-report`、`knowledge-card`、`plan`、`report` 等文档类型
- 需要精确排版时，可直接使用结构化 JSON

## 目录规划

在创建新路径前，先看现有目录树：

```bash
node scripts/inspect_tree.js --max-depth 3 --keyword "memory"
```

目录规划原则：

- 优先复用已有分支
- 尽量保持浅层目录
- 优先用“较短路径 + 清晰页面标题”，不要随手建 4 级路径
- 默认尽量控制在根页面下 1-2 层，除非用户明确要求更深层级

## 常用命令

创建短笔记：

```bash
node scripts/create_note.js "会议记录" "Markdown 内容" --type note
```

从 Markdown 文件创建美化后的长文档：

```bash
node scripts/create_note_from_file.js "每周记忆系统复盘" "/absolute/path/to/review.md" --type weekly-report --tags memory,openclaw
```

在指定路径下创建长文档：

```bash
node scripts/create_note_from_file_in_path.js "Research/OpenClaw" "技能调研" "/absolute/path/to/review.md" --type research
```

从 JSON 创建精确版式文档：

```bash
node scripts/create_structured_note_from_file_in_path.js "Research/OpenClaw" "/absolute/path/to/spec.json"
```

页面创建后再移动到目标路径：

```bash
node scripts/move_page.js "page-id-or-title" "Research/OpenClaw"
```

## Markdown Front Matter

基于 Markdown 文件的创建脚本支持这种头部元信息：

```yaml
---
doc_type: decision-log
summary: 先安装一个长期记忆技能，保持技能栈尽量精简。
status: Draft
owner: Codex
updated_at: 2026-03-11
tags: memory, openclaw
---
```

## 配置

### 1. 获取 Notion API Key

1. 打开 https://www.notion.so/my-integrations
2. 创建一个新的内部集成
3. 打开 Read、Update、Insert 权限
4. 复制生成的 Internal Integration Secret

### 2. 设置环境变量

**Windows (PowerShell)：**

```powershell
[System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', 'your_api_key', 'User')
```

**Linux / Mac：**

```bash
echo 'export NOTION_API_KEY="your_api_key"' >> ~/.bashrc && source ~/.bashrc
```

### 3. 授权页面

在需要访问的 Notion 页面中点击 `...` -> **Add connections** -> 选择你的 integration -> 确认。

## 技术特性

- 零依赖
- 网络请求自动重试
- 支持 Windows / Linux / Mac
- 安装后可在多个 AI 智能体中使用

## License

MIT
