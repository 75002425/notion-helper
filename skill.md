---
name: notion-helper
description: Use when user wants to create a Notion note or document, including under planned nested page paths, search Notion pages, or append content to an existing Notion page.
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

### Default execution policy

1. For normal Notion work, use the provided scripts directly.
2. Do not write new JS, TS, Python, or shell scripts if one of the provided scripts already covers the task.
3. For long content, first write Markdown to a temp `.md` file, then call `create_note_from_file.js`.
4. If the request includes a desired location such as a category, folder, section, or multi-level path, use the path-aware scripts instead of creating directly under the root page.
5. When appending to an existing page, prefer page ID. If the page may be ambiguous, run `search.js` first and then use the returned ID.
6. If the request is outside the current script set, state that the standard `notion-helper` skill does not support it yet. Do not improvise with new code unless the user explicitly asks to extend or debug this skill itself.

### Supported scripts

#### Create a note (short content)

```bash
node scripts/create_note.js "title" "markdown content"
```

- Use for short notes or small one-shot content
- Automatically finds the authorized root page (parent.type === workspace) as parent
- Automatically batches blocks if content exceeds 100 blocks
- Content supports Markdown headings, lists, code blocks, tables, bold, italic, and links

#### Create a note from Markdown file (long content)

```bash
node scripts/create_note_from_file.js "title" "/absolute/path/to/file.md"
```

- This is the default path for generated documents, reports, summaries, or long structured content
- First write content to a temp `.md` file, then use this script
- Same auto-batching and root page detection as create_note.js

#### Ensure a nested page path

```bash
node scripts/ensure_path.js "Research/Strategy/Reviews"
```

- Creates missing child pages under the authorized root page
- Reuses existing child pages by exact title match
- Use this when the user asks for a directory, section, category, or multi-level page structure

#### Create a note in a nested page path

```bash
node scripts/create_note_in_path.js "Research/Strategy" "title" "markdown content"
```

- Ensures the target page path exists first
- Then creates the new page under the final path page
- Use this for short content that belongs in a specific subpage path

#### Create a note from Markdown file in a nested page path

```bash
node scripts/create_note_from_file_in_path.js "Research/Strategy" "title" "/absolute/path/to/file.md"
```

- This is the default path-aware flow for generated documents
- Ensures the full nested path exists before creating the document
- Use this when the user specifies both document content and a target directory path

#### Search pages

```bash
node scripts/search.js "keyword"
```

- Returns page title, ID, parent type, and URL

#### Append content to existing page

```bash
node scripts/append.js "page-id-or-title" "markdown content"
```

- Accepts page ID (UUID) or page title (searched automatically)
- Prefer page ID when accuracy matters
- Auto-batches if content exceeds 100 blocks

### Standard workflows

#### Create a long document

1. Compose the full Markdown content.
2. Write it to a temp file such as `/tmp/doc.md`.
3. Run `node scripts/create_note_from_file.js "Document Title" "/tmp/doc.md"`.
4. Clean up the temp file.

#### Create a long document in a nested path

1. Compose the full Markdown content.
2. Write it to a temp file such as `/tmp/doc.md`.
3. If needed, ensure the target path with `node scripts/ensure_path.js "Research/Strategy"`.
4. Run `node scripts/create_note_from_file_in_path.js "Research/Strategy" "Document Title" "/tmp/doc.md"`.
5. Clean up the temp file.

#### Append to an existing page safely

1. If the exact page ID is already known, use it directly.
2. Otherwise run `node scripts/search.js "keyword"` first.
3. Use the returned page ID with `append.js` if multiple pages could match the same title.

### Hard rules for AI agents

- **NEVER write custom scripts for normal create/search/append tasks**.
- **NEVER call `notion_api.js` directly for ordinary use**.
- **NEVER pick a random page as parent**. Use the provided create scripts so `findRootPage()` decides correctly.
- **When location matters, NEVER fall back to root-page creation**. Use the path-aware scripts.
- **NEVER pass a long document inline**. Use `create_note_from_file.js` with a temp Markdown file.
- **NEVER guess when a page title may be ambiguous**. Search first and prefer page ID.
- **If the request is unsupported, say so clearly instead of generating new Notion code**.
- **All provided scripts output `OK` on success**. Check for that in the command output.

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
