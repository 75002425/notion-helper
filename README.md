# notion-helper

Secure Notion integration tool with zero external dependencies (pure Node.js built-in modules) for managing a Notion workspace from any AI agent.

[中文文档](./README_CN.md)

## Features

- Write Notion pages with pure Node.js
- Search, append, move, and archive pages
- Plan and create nested page paths under the authorized root page
- Render beautified documents from Markdown instead of dumping raw paragraph blocks
- Support exact-layout structured documents from JSON
- Work across agents after a single global install

## Installation

```bash
npx skills add 75002425/notion-helper -g
```

- `-g` installs the skill globally for the current agent
- The exact install directory is decided by `skills`, such as `~/.claude/skills/` or `~/.agents/skills/`

## Upgrade

Re-run the same command:

```bash
npx skills add 75002425/notion-helper -g
```

`skills` will detect the existing installation and upgrade it to the latest version.

## What Changed

`notion-helper` is no longer just a Markdown-to-block converter. Long-form documents now go through a document design layer and a Notion renderer:

- Markdown files can include front matter for document metadata
- Semantic sections such as summary, key findings, risks, next actions, references, and appendix are recognized automatically
- Supported document types include `note`, `research`, `meeting-notes`, `decision-log`, `weekly-report`, `knowledge-card`, `plan`, and `report`
- Structured JSON specs are supported when exact layout control is required

## Directory Planning

Use the page tree before creating a new path:

```bash
node scripts/inspect_tree.js --max-depth 3 --keyword "memory"
```

Then keep the final path shallow and reusable:

- Reuse an existing branch when possible
- Prefer `Research/OpenClaw` plus a clear page title over a 4-level topic stack
- Stay within 1-2 levels below root unless the user explicitly wants a deeper taxonomy

## Common Commands

Create a short note:

```bash
node scripts/create_note.js "Meeting Notes" "Markdown content" --type note
```

Create a long, beautified document from Markdown:

```bash
node scripts/create_note_from_file.js "Weekly Memory Review" "/absolute/path/to/review.md" --type weekly-report --tags memory,openclaw
```

Create a long document in a nested path:

```bash
node scripts/create_note_from_file_in_path.js "Research/OpenClaw" "Skill Review" "/absolute/path/to/review.md" --type research
```

Create an exact-layout document from JSON:

```bash
node scripts/create_structured_note_from_file_in_path.js "Research/OpenClaw" "/absolute/path/to/spec.json"
```

Move a page after creation:

```bash
node scripts/move_page.js "page-id-or-title" "Research/OpenClaw"
```

## Markdown Front Matter

The Markdown file-based create scripts accept simple front matter:

```yaml
---
doc_type: decision-log
summary: Start with one durable memory skill and keep the stack small.
status: Draft
owner: Codex
updated_at: 2026-03-11
tags: memory, openclaw
---
```

## Configuration

### 1. Get Notion API Key

1. Log in to Notion and visit https://www.notion.so/my-integrations
2. Create a new internal integration
3. Enable Read, Update, and Insert capabilities
4. Copy the generated Internal Integration Secret

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

On the Notion page you want to access: click `...` -> **Add connections** -> select your integration -> confirm.

## Technical Notes

- Zero dependencies
- Automatic retry with exponential backoff
- Windows / Linux / Mac support
- Compatible with multiple coding agents after installation

## License

MIT
