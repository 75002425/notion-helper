#!/usr/bin/env node
/**
 * Create a Notion page from a Markdown file under a nested path below the authorized root page.
 * Usage: node create_note_from_file_in_path.js "Research/Strategy" "title" "/path/to/file.md" [--type note|research|meeting-notes|decision-log|weekly-report|knowledge-card|plan|report]
 */
const fs = require('fs');

const NotionAPI = require('./notion_api.js');
const { parseDocumentOptions } = require('./document_cli.js');
const { buildDocumentSpecFromMarkdown } = require('./document_designer.js');
const {
  documentSpecToBlocks,
  documentSpecToPageOptions,
} = require('./document_renderer.js');
const { ensurePagePath } = require('./path_utils.js');

const pagePath = process.argv[2];
const title = process.argv[3];
const filePath = process.argv[4];
let options = {};

try {
  options = parseDocumentOptions(process.argv.slice(5));
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

if (!pagePath || !title || !filePath) {
  console.error('Usage: node create_note_from_file_in_path.js "page/path" "title" "/path/to/file.md" [options]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const parentPage = await ensurePagePath(api, pagePath);
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const spec = buildDocumentSpecFromMarkdown({
    title,
    markdown,
    ...options,
  });
  const blocks = documentSpecToBlocks(spec);
  const page = await api.createPageSafe(
    parentPage.id,
    title,
    blocks,
    documentSpecToPageOptions(spec)
  );

  console.log('OK');
  console.log('PAGE_ID:', page.id);
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
