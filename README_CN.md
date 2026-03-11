# notion-helper

安全的 Notion 集成工具，零外部依赖（纯 Node.js 内置模块），帮你在任何 AI 代理中管理 Notion 工作区。

[English Documentation](./README.md)

## 功能

- 📝 **写笔记** — 快速创建 Notion 页面
- 📄 **对话转文档** — 将对话内容整理为结构化 Notion 文档
- 📂 **目录规划** — 在已授权根页下按路径创建多级子页面
- 🔍 **搜索** — 搜索工作区中的页面和数据库
- ✏️ **追加内容** — 向已有页面继续追加 Markdown 内容
- 🎨 **美观排版** — 标题、列表、callout、代码块、折叠块等丰富格式

## 安装

```bash
npx skills add 75002425/notion-helper -g
```

- `-g` 全局安装（用户级）
- 安装到当前代理的标准全局技能目录，可在所有项目中使用
- 具体目录由 `skills` 根据当前代理决定，例如 `~/.claude/skills/` 或 `~/.agents/skills/`

## 升级

已安装 `notion-helper` 的用户，重复执行同一条命令即可升级：

```bash
npx skills add 75002425/notion-helper -g
```

`skills` 会检测现有安装并更新到最新版本。

## 配置

### 1. 获取 Notion API Key

1. 登录 Notion，访问 https://www.notion.so/my-integrations
2. 在左侧边栏最下方找到 **"内部集成"** 按钮，点击进入
3. 点击右上角 **"+ New integration"**（新建集成）
4. 填写集成名称（如 `agent` 或 `notion-helper`）
5. 选择关联的工作区
6. 在 **"内容功能"** 部分，勾选权限：
   - ✅ Read content（读取内容）
   - ✅ Update content（更新内容）
   - ✅ Insert content（插入内容）
7. 点击 **"提交"**，复制生成的 **Internal Integration Secret**（以 `ntn_` 开头）

### 2. 设置环境变量

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', '你的API_KEY', 'User')
```

**Linux / Mac:**
```bash
echo 'export NOTION_API_KEY="你的API_KEY"' >> ~/.bashrc && source ~/.bashrc
```

### 3. 授权页面

在需要访问的 Notion 页面上：点击 `···` → **Add connections** → 选择你的 integration → 确认

## 使用示例

```
帮我在 Notion 创建一个笔记，标题是"会议记录"
搜索 Notion 中包含"项目"的页面
把我们刚才的讨论整理成 Notion 文档
把复盘文档放到 Notion 的"研究/策略/均线系统"目录下
```

## 标准用法

- 对常规 Notion 操作，智能体应直接调用仓库内现成脚本，而不是重写新的 JS 脚本
- 长文档应先写入临时 Markdown 文件，再调用 `node scripts/create_note_from_file.js "标题" "/absolute/path/to/file.md"`
- 如果用户指定了目录、栏目、分类或多级路径，应使用路径脚本，例如 `node scripts/create_note_from_file_in_path.js "研究/策略/均线系统" "复盘" "/absolute/path/to/file.md"`
- 如需提前补齐目录，可先执行 `node scripts/ensure_path.js "研究/策略/均线系统"`
- 追加到已有页面时，优先使用 page ID；如果标题可能重名，先用 `node scripts/search.js "关键词"` 查询
- 当前标准脚本覆盖路径规划、创建、搜索、追加；超出这几个范围的操作，不建议由智能体临时生成新 Notion 脚本

## 技术特点

- **零依赖** — 纯 Node.js 内置模块（https），无需 npm install
- **自动重试** — 网络请求自动重试，指数退避策略
- **跨平台** — Windows / Linux / Mac 全支持
- **多代理** — 安装后所有 AI 代理（Claude Code、Cursor、Qwen Code 等）均可使用

## License

MIT
