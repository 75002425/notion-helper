---
name: notion-helper
description: Use when the user wants to create, organize, search, move, archive, or append Notion pages, including beautified documents created from Markdown or structured JSON under planned nested page paths.
---

# Notion Helper

Secure Notion integration tool with zero external dependencies (pure Node.js built-in modules) for reliable Notion workspace management.

## Installation and Upgrade

Recommended global install:

```bash
npx skills add 75002425/notion-helper -g
```

Re-run the same command to upgrade `notion-helper`. `skills` will detect the existing installation and update it to the latest version.

## AI Agent Execution Guide

**IMPORTANT: This section defines how AI agents should use this skill. Prefer the built-in scripts over custom Notion code.**

All scripts are located in this skill's `scripts/` directory. Run them with `node` from that directory.

### Default execution policy

1. For normal Notion work, use the provided scripts directly.
2. Do not write new JS, TS, Python, or shell scripts if one of the provided scripts already covers the task.
3. For long documents, prefer the file-based create scripts. They now pass content through a document design layer and Notion renderer instead of raw line-by-line Markdown conversion.
4. If exact layout matters, create a structured JSON spec and use the `create_structured_*` scripts.
5. If location matters and the user did not provide an exact path, inspect the existing tree first and reuse the closest existing branch before creating anything new.
6. Keep paths shallow by default: prefer 1-2 levels below the authorized root page, and only go deeper when the user explicitly asks for it or the existing taxonomy already uses that depth.
7. When appending, moving, or deleting, prefer page ID. If the page may be ambiguous, search first.

### Supported document types

The design layer supports these document types:

- `note`
- `research`
- `meeting-notes`
- `decision-log`
- `weekly-report`
- `knowledge-card`
- `plan`
- `report`

Aliases such as `meeting`, `decision`, `weekly_report`, and `knowledge_card` are also accepted.

### Common metadata flags

The Markdown create scripts accept optional flags after the required positional arguments:

```bash
--type
--summary
--status
--owner
--updated-at
--tags
--icon
--cover
```

Example:

```bash
node scripts/create_note_from_file.js "Weekly Memory Review" "/absolute/path/to/review.md" --type weekly-report --tags memory,openclaw --owner Codex --updated-at 2026-03-11
```

### Supported scripts

#### Inspect the current page tree

```bash
node scripts/inspect_tree.js --max-depth 3 --keyword "memory"
```

- Use before planning a new path
- Reuse existing branches whenever possible
- If no good branch exists, create the shallowest path that still makes sense

#### Ensure a nested page path

```bash
node scripts/ensure_path.js "Research/OpenClaw"
```

- Creates missing child pages under the authorized root page
- Reuses existing child pages by exact title match
- Adjacent duplicate path segments are collapsed automatically

#### Create a short note

```bash
node scripts/create_note.js "title" "markdown content" --type note
```

- Good for short one-shot notes
- If the content is long, multi-line, or typed, the script automatically upgrades it into a designed Notion document

#### Create a long document from Markdown file

```bash
node scripts/create_note_from_file.js "title" "/absolute/path/to/file.md" --type research
```

- Default path for long documents, reports, meeting notes, weekly reports, and knowledge cards
- Supports optional front matter at the top of the Markdown file:

```yaml
---
doc_type: weekly-report
summary: Durable memory work progressed this week.
status: Draft
owner: Codex
updated_at: 2026-03-11
tags: memory, openclaw
---
```

- The script extracts semantic sections such as summary, key findings, risks, next actions, references, and appendix, then renders a more polished Notion page

#### Create a note in a nested path

```bash
node scripts/create_note_in_path.js "Research/OpenClaw" "title" "markdown content" --type note
```

- Ensures the target page path exists first
- Then creates the page under the final path page

#### Create a long document in a nested path

```bash
node scripts/create_note_from_file_in_path.js "Research/OpenClaw" "title" "/absolute/path/to/file.md" --type decision-log
```

- This is the default path-aware flow for long documents
- Preferred when the user specifies both a target location and a document to generate

#### Create a structured document from JSON

```bash
node scripts/create_structured_note_from_file.js "/absolute/path/to/spec.json"
node scripts/create_structured_note_from_file_in_path.js "Research/OpenClaw" "/absolute/path/to/spec.json"
```

- Use when you need exact layout control
- The JSON spec can include:
  - `title`
  - `doc_type`
  - `icon`
  - `cover`
  - `summary`
  - `status`
  - `owner`
  - `updated_at`
  - `tags`
  - `key_findings`
  - `decision`
  - `open_questions`
  - `sections`
  - `risks`
  - `next_actions`
  - `references`
  - `appendix`

#### Search pages

```bash
node scripts/search.js "keyword"
```

- Returns page title, ID, parent type, and URL

#### Append content to an existing page

```bash
node scripts/append.js "page-id-or-title" "markdown content"
```

#### Move a page under a different path

```bash
node scripts/move_page.js "page-id-or-title" "Research/OpenClaw"
```

- Useful when a page was created first and organized later

#### Archive a page

```bash
node scripts/delete_page.js "page-id-or-title"
```

### Directory planning rules

- Never create a deep path just because the document title is specific.
- Prefer `Research/OpenClaw` plus a descriptive page title over `Research/Memory/OpenClaw/Skill Survey`.
- Reuse an existing branch if it already matches the topic.
- If there is no good branch, create the smallest taxonomy that is still reusable.
- Stay under 2 levels below root unless the user explicitly asks for deeper nesting or the existing tree already requires it.

### Recommended workflows

#### Long, polished document in a planned path

1. Inspect the tree with `inspect_tree.js` if the target path is not already obvious.
2. Choose or create a shallow reusable path.
3. Write the content to a temp Markdown file with optional front matter.
4. Run `create_note_from_file_in_path.js` with `--type`.

#### Exact-layout document

1. Build a JSON spec instead of raw Markdown.
2. Run `create_structured_note_from_file.js` or `create_structured_note_from_file_in_path.js`.

#### Safe page update

1. Search first if the page title may be ambiguous.
2. Use page ID for append, move, or delete operations.

### Hard rules for AI agents

- **NEVER write custom Notion scripts for normal create/search/append/move/archive tasks.**
- **NEVER call `notion_api.js` directly for ordinary use.**
- **When location matters, NEVER skip tree inspection or path planning.**
- **NEVER create gratuitously deep paths.**
- **For long documents, prefer the designed file-based scripts over inline content.**
- **When high-quality layout matters, prefer structured JSON over ad hoc Markdown.**
- **If the request is unsupported, say so clearly instead of improvising new Notion code.**
- **All provided scripts output `OK` on success. Check for that in the command output.**

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

On the Notion page: click `...` -> **Add connections** -> select your integration -> confirm.

> Only authorized pages and their sub-pages can be accessed by the API.
