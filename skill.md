---
name: notion-helper
description: Notion integration tool for creating notes, generating docs, organizing pages, and searching. Triggers when user mentions Notion, note sync, writing to Notion, organizing Notion docs, or Notion pages. Also triggers for casual requests like "take a note in Notion" or "save this conversation to Notion".
---

# Notion Helper

Secure Notion integration tool with zero external dependencies (pure Node.js built-in modules) for efficient Notion workspace management.

## Installation and Upgrade

Recommended global install:

```bash
npx skills add 75002425/notion-helper -g
```

Re-run the same command to upgrade `notion-helper`. `skills` will detect the existing installation and update it to the latest version.

## AI Agent Execution Guide

**IMPORTANT: This section defines exactly how AI agents must use this skill. Follow these steps precisely.**

All scripts are located in this skill's `scripts/` directory. Run them with `node` from that directory.

### Create a note (short content)

```bash
node scripts/create_note.js "title" "markdown content"
```

- Automatically finds the authorized root page (parent.type === workspace) as parent
- Automatically batches blocks if content exceeds 100 blocks
- Content supports full Markdown: headings, lists, code blocks, tables, bold, italic, links

### Create a note from Markdown file (long content)

```bash
node scripts/create_note_from_file.js "title" "/absolute/path/to/file.md"
```

- For long documents: first write content to a temp .md file, then use this script
- Same auto-batching and root page detection as create_note.js

### Search pages

```bash
node scripts/search.js "keyword"
```

- Returns page title, ID, parent type, and URL

### Append content to existing page

```bash
node scripts/append.js "page-id-or-title" "markdown content"
```

- Accepts page ID (UUID) or page title (searched automatically)
- Auto-batches if content exceeds 100 blocks

### Workflow for creating documents

1. Compose the full Markdown content
2. Write it to a temp file (e.g., `/tmp/doc.md`)
3. Run: `node scripts/create_note_from_file.js "Document Title" "/tmp/doc.md"`
4. Clean up the temp file

### Key rules for AI agents

- **NEVER write custom scripts** — use the provided scripts above
- **NEVER pick a random page as parent** — scripts use `findRootPage()` to locate the correct authorized root page automatically
- **Long content** — use `create_note_from_file.js` with a temp .md file, not inline arguments
- **All scripts output `OK` on success** — check for this in the output

## API Reference (for advanced/custom usage only)

```javascript
const NotionAPI = require('./scripts/notion_api');
const { textToBlocks } = require('./scripts/formatter');

const api = new NotionAPI();

// Find authorized root page (ALWAYS use this, never search('')[0])
const root = await api.findRootPage();

// Create page with auto-batching (handles >100 blocks)
const page = await api.createPageSafe(root.id, 'Title', blocks);

// Search
const result = await api.search('keyword', 'page', 20);

// Append content (batch manually for >100 blocks)
await api.appendBlocks(pageId, blocks);

// Other: getBlockChildren, updateBlock, deleteBlock
```

## Formatter Reference

`scripts/formatter.js` converts Markdown to Notion blocks:

| Function | Purpose |
|----------|---------|
| `textToBlocks(md)` | Full Markdown → Notion blocks (headings, lists, code blocks, tables, quotes, dividers) |
| `createCallout(text, emoji)` | Callout box |
| `createCodeBlock(code, lang)` | Code block with syntax highlighting |
| `createDivider()` | Horizontal divider |
| `createToc()` | Table of contents |
| `createToggle(title, children)` | Collapsible toggle block |
| `rich(text, {bold, italic, code, url})` | Rich text constructor |

## Prerequisites

### Step 1: Get Notion API Key

1. Visit https://www.notion.so/my-integrations
2. Create a new internal integration with Read/Update/Insert permissions
3. Copy the Internal Integration Secret (starts with `ntn_`)

### Step 2: Set Environment Variable

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', 'your_api_key', 'User')
```

**Linux / Mac:**
```bash
echo 'export NOTION_API_KEY="your_api_key"' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Authorize Page Access

On the Notion page: click `···` → **Add connections** → select your integration → confirm.

> Only authorized pages (and their sub-pages) can be accessed by the API.
