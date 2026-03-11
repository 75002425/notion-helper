# notion-helper

Secure Notion integration tool with zero external dependencies (pure Node.js built-in modules) for managing Notion workspace in any AI agent.

[中文文档](./README_CN.md)

## Features

- 📝 **Write Notes** — Quickly create Notion pages
- 📄 **Conversation to Document** — Organize conversations into structured Notion documents
- 🗂️ **Organize Pages** — Reorganize page structure and directory hierarchy
- 🔍 **Search** — Search pages and databases in workspace
- ✏️ **Modify Pages** — Append, update, delete existing page content
- 🎨 **Beautiful Formatting** — Rich formats including headings, lists, callouts, code blocks, toggles, etc.

## Installation

```bash
npx skills add 75002425/notion-helper -g
```

- `-g` Global installation (user-level)
- Installs to the current agent's standard global skills directory and works across projects
- The exact path is determined by `skills` for the active agent, such as `~/.claude/skills/` or `~/.agents/skills/`

## Upgrade

Re-run the same command to upgrade `notion-helper`:

```bash
npx skills add 75002425/notion-helper -g
```

`skills` will detect the existing installation and update it to the latest version.

## Configuration

### 1. Get Notion API Key

1. Log in to Notion and visit https://www.notion.so/my-integrations
2. Find the **"Internal integrations"** button at the bottom of the left sidebar
3. Click **"+ New integration"** in the top right
4. Fill in the integration name (e.g., `agent` or `notion-helper`)
5. Select the associated workspace
6. In the **"Capabilities"** section, check permissions:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
7. Click **"Submit"** and copy the generated **Internal Integration Secret** (starts with `ntn_`)

### 2. Set Environment Variable

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', 'your_api_key', 'User')
```

**Linux / Mac:**
```bash
echo 'export NOTION_API_KEY="your_api_key"' >> ~/.bashrc && source ~/.bashrc
```

### 3. Authorize Pages

On the Notion page you want to access: Click `···` → **Add connections** → Select your integration → Confirm

## Usage Examples

```
Create a note in Notion with title "Meeting Notes"
Search for pages containing "project" in Notion
Organize our discussion into a Notion document
```

## Technical Features

- **Zero Dependencies** — Pure Node.js built-in modules (https), no npm install required
- **Auto Retry** — Network requests with automatic retry and exponential backoff
- **Cross-platform** — Windows / Linux / Mac fully supported
- **Multi-agent** — Works with all AI agents (Claude Code, Cursor, Qwen Code, etc.) after installation

## License

MIT
