---
name: notion-helper
description: Notion integration tool for creating notes, generating docs, organizing pages, and searching. Triggers when user mentions Notion, note sync, writing to Notion, organizing Notion docs, or Notion pages. Also triggers for casual requests like "take a note in Notion" or "save this conversation to Notion".
---

# Notion Helper

Secure Notion integration tool with zero external dependencies (pure Node.js built-in modules) for efficient Notion workspace management.

## Core Capabilities

1. **Write Notes** — Quickly create Notion pages with titles, paragraphs, lists, code blocks, etc.
2. **Conversation to Document** — Extract and organize conversation content into structured Notion documents
3. **Organize Pages** — Reorganize page structure and directory hierarchy
4. **Search** — Search pages and databases in your Notion workspace
5. **Beautiful Formatting** — Support for headings, lists, callouts, code blocks, dividers, table of contents, and more

## Prerequisites

Complete these two configuration steps before use:

### Step 1: Get Notion API Key

1. Log in to Notion and visit https://www.notion.so/my-integrations
2. Find the **"Internal integrations"** button at the bottom of the left sidebar
3. Click **"+ New integration"** in the top right
4. Fill in the integration name (e.g., `agent` or `notion-helper`)
5. Select the associated workspace
6. In the **"Capabilities"** section, check the following permissions:
   - ✅ **Read content**
   - ✅ **Update content**
   - ✅ **Insert content**
7. Click **"Submit"** to create the integration
8. Copy the generated **Internal Integration Secret** (starts with `ntn_`), this is your API Key

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

On the Notion page you want to access:
1. Click the `···` menu in the top right
2. Select **"Add connections"**
3. Search for and select your integration name
4. Confirm authorization

> Only authorized pages (and their sub-pages) can be accessed by the API.

## Usage Guide

### Connect to Notion

Before each operation, use the API client in `scripts/notion_api.js` to connect to Notion. The script will:
- Automatically read the API Key from environment variables
- Use Node.js built-in https module, no dependencies required
- Automatic retry and chunked reading for better network stability

```javascript
// Usage example (in script)
const NotionAPI = require('./scripts/notion_api');
const { textToBlocks } = require('./scripts/formatter');

const api = new NotionAPI();
```

### 1. Search Pages

```
Search for pages containing "project" in Notion
```

Execution: Call `api.search("project")`

### 2. Create Note

```
Create a note in Notion with title "Meeting Notes" and content about project progress
```

Execution flow:
1. Use `api.search("")` to find available parent pages
2. Use `textToBlocks()` from `scripts/formatter.js` to convert content to Notion blocks
3. Use `api.createPage(parentId, title, blocks)` to create the page

### 3. Conversation to Document

```
Organize our discussion into a Notion document
```

Execution flow:
1. Extract key content from conversation history
2. Organize into structured format (headings + paragraphs + lists)
3. Convert to Notion blocks using formatter and create page

### 4. Organize Page Structure

```
Organize the sub-pages of "Work Notes" in Notion
```

Execution flow:
1. Use `api.search("Work Notes")` to find target page
2. Use `api.getBlockChildren(pageId)` to get child content
3. Reorganize as needed (delete, append, update blocks)

### 5. Modify Existing Page

```
Add a paragraph to that page
```

Execution flow:
1. Use `api.appendBlocks(pageId, newBlocks)` to append content
2. Or use `api.updateBlock(blockId, newContent)` to modify specific block
3. Or use `api.deleteBlock(blockId)` to delete specific block

## Formatting Reference

`scripts/formatter.js` provides the following conversion functions:

| Function | Purpose | Example |
|----------|---------|---------|
| `textToBlocks(text)` | Markdown text → Notion blocks | Auto-detect `#` headings, `-` lists, paragraphs |
| `createCallout(text, emoji)` | Create callout box | 💡 Highlight information |
| `createCodeBlock(code, lang)` | Create code block | Syntax highlighting support |
| `createDivider()` | Create divider | — |
| `createToc()` | Create table of contents | Auto-generate page TOC |
| `createToggle(title, children)` | Create toggle block | Expandable/collapsible content |
| `rich(text, options)` | Rich text constructor | Bold, code, color |

### Manual Block Construction

When formatter is insufficient, you can directly construct Notion API block format:

```javascript
// Formatted paragraph
const block = {
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: [
      { type: 'text', text: { content: 'Normal text' } },
      { type: 'text', text: { content: 'Bold' }, annotations: { bold: true } },
      { type: 'text', text: { content: 'Code' }, annotations: { code: true } }
    ]
  }
};
```

## Important Notes

- All API calls are executed through `scripts/notion_api.js`, no third-party packages required
- Notion API limit: Maximum 100 child blocks per page creation, use `appendBlocks` for more
- Pages must be authorized to the integration first, otherwise search results will be empty
- Network requests include automatic retry mechanism with exponential backoff
