---
name: notion-helper
description: Notion 集成工具，支持写笔记、生成文档、整理页面结构、搜索页面。当用户提到 Notion、笔记同步、写入 Notion、整理 Notion 文档、notion 页面等关键词时使用此技能。即使用户只是说"帮我记个笔记到 Notion"或"把这段对话整理成文档存到 Notion"也应触发。
---

# Notion Helper

安全的 Notion 集成工具，零外部依赖（纯 Python 标准库），帮你高效管理 Notion 工作区。

## 核心能力

1. **写笔记** — 快速创建 Notion 页面，支持标题、段落、列表、代码块等
2. **对话转文档** — 将当前对话内容提取整理为结构化 Notion 文档
3. **整理页面** — 重新组织页面结构和目录层级
4. **搜索** — 搜索 Notion 工作区中的页面和数据库
5. **美观排版** — 支持标题、列表、callout、代码块、分隔线、目录等丰富格式

## 前置配置

使用前必须完成两步配置：

### 第 1 步：获取 Notion API Key

1. 登录 Notion，访问 https://www.notion.so/my-integrations
2. 在左侧边栏最下方找到 **"内部集成"** 按钮，点击进入
3. 点击右上角 **"+ New integration"**（新建集成）
4. 填写集成名称（如 `agent` 或 `notion-helper`）
5. 选择关联的工作区（Workspace）
6. 在 **"内容功能"** 部分，勾选以下权限：
   - ✅ **Read content**（读取内容）
   - ✅ **Update content**（更新内容）
   - ✅ **Insert content**（插入内容）
7. 点击 **"提交"** 创建集成
8. 复制生成的 **Internal Integration Secret**（以 `ntn_` 开头），这就是你的 API Key

### 第 2 步：设置环境变量

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', '你的API_KEY', 'User')
```

**Linux / Mac:**
```bash
echo 'export NOTION_API_KEY="你的API_KEY"' >> ~/.bashrc
source ~/.bashrc
```

### 第 3 步：授权页面访问

在需要访问的 Notion 页面上：
1. 点击右上角 `···` 菜单
2. 选择 **"Add connections"**（添加关联）
3. 搜索并选择你创建的 integration 名称
4. 确认授权

> 只有被授权的页面（及其子页面）才能被 API 访问。

## 使用指南

### 连接 Notion

每次操作前，先运行 `scripts/notion_api.py` 中的 API 客户端连接 Notion。脚本会：
- 自动读取环境变量中的 API Key
- 自动检测系统代理设置（Windows 注册表）
- 无需手动配置代理

```python
# 用法示例（在脚本中）
import subprocess, sys, os

skill_dir = os.path.dirname(os.path.abspath(__file__))
# 或者直接 import
sys.path.insert(0, skill_dir)
from scripts.notion_api import NotionAPI

api = NotionAPI()
```

### 1. 搜索页面

```
帮我搜索 Notion 中包含"项目"关键词的页面
```

执行方式：调用 `api.search("项目")`

### 2. 创建笔记

```
帮我在 Notion 创建一个笔记，标题是"会议记录"，内容是今天讨论了项目进度
```

执行流程：
1. 用 `api.search("")` 找到可用的父页面
2. 用 `scripts/formatter.py` 中的 `text_to_blocks()` 将内容转为 Notion 块
3. 用 `api.create_page(parent_id, title, blocks)` 创建页面

### 3. 对话转文档

```
把我们刚才讨论的内容整理成 Notion 文档
```

执行流程：
1. 从对话历史中提取关键内容
2. 组织为结构化格式（标题 + 段落 + 列表）
3. 用 formatter 转为 Notion 块后创建页面

### 4. 整理页面结构

```
帮我整理 Notion 中"工作笔记"页面的子页面
```

执行流程：
1. 用 `api.search("工作笔记")` 找到目标页面
2. 用 `api.get_block_children(page_id)` 获取子内容
3. 按需重新组织（删除、追加、更新块）

### 5. 修改已有页面

```
帮我在那个页面后面加一段内容
```

执行流程：
1. 用 `api.append_blocks(page_id, new_blocks)` 追加内容
2. 或用 `api.update_block(block_id, new_content)` 修改指定块
3. 或用 `api.delete_block(block_id)` 删除指定块

## 格式化参考

`scripts/formatter.py` 提供以下格式转换函数：

| 函数 | 用途 | 示例 |
|------|------|------|
| `text_to_blocks(text)` | Markdown 文本 → Notion 块 | 自动识别 `#` 标题、`-` 列表、段落 |
| `create_callout(text, emoji)` | 创建提示框 | 💡 高亮提示信息 |
| `create_code_block(code, lang)` | 创建代码块 | 支持语法高亮 |
| `create_divider()` | 创建分隔线 | — |
| `create_toc()` | 创建目录 | 自动生成页面目录 |
| `create_toggle(title, children)` | 创建折叠块 | 可展开/收起的内容 |
| `rich(text, bold, code, color)` | 富文本构造器 | 粗体、代码、颜色 |

### 手动构造 Notion 块

当 formatter 不够用时，可以直接构造 Notion API 的块格式：

```python
# 带格式的段落
block = {
    "object": "block",
    "type": "paragraph",
    "paragraph": {
        "rich_text": [
            {"type": "text", "text": {"content": "普通文本"}},
            {"type": "text", "text": {"content": "粗体"}, "annotations": {"bold": True}},
            {"type": "text", "text": {"content": "代码"}, "annotations": {"code": True}},
        ]
    }
}
```

## 代理使用须知

- 所有 API 调用通过 `scripts/notion_api.py` 执行，无需安装任何第三方包
- 脚本会自动处理代理（proxy）设置，Windows 用户无需额外配置
- Notion API 限制：每次创建页面最多 100 个子块，超过需分批 `append_blocks`
- 页面必须先被授权给 integration，否则搜索结果为空
