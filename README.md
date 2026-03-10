# notion-helper

安全的 Notion 集成工具，零外部依赖（纯 Python 标准库），帮你在任何 AI 代理中管理 Notion 工作区。

## 功能

- 📝 **写笔记** — 快速创建 Notion 页面
- 📄 **对话转文档** — 将对话内容整理为结构化 Notion 文档
- 🗂️ **整理页面** — 重新组织页面结构和目录层级
- 🔍 **搜索** — 搜索工作区中的页面和数据库
- ✏️ **修改页面** — 追加、更新、删除已有页面内容
- 🎨 **美观排版** — 标题、列表、callout、代码块、折叠块等丰富格式

## 安装

```bash
npx skills add <your-github-username>/notion-helper -g --agent '*' -y
```

- `-g` 全局安装（用户级）
- `--agent '*'` 关联到所有 AI 代理

## 配置

### 1. 获取 Notion API Key

1. 访问 https://www.notion.so/my-integrations
2. 点击 **"+ New integration"**
3. 填写名称，选择工作区
4. 勾选权限：**Read content, Update content, Insert content**
5. 复制 API key（以 `ntn_` 开头）

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
```

## 技术特点

- **零依赖** — 纯 Python 标准库（urllib），无需 pip install
- **自动代理** — Windows 自动检测系统代理，Linux/Mac 读取环境变量
- **跨平台** — Windows / Linux / Mac 全支持
- **多代理** — 安装后所有 AI 代理（Claude Code、Cursor、Qwen Code 等）均可使用

## License

MIT
