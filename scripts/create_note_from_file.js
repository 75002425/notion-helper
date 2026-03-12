#!/usr/bin/env node
/**
 * Create a Notion page from a Markdown file.
 * Usage: node create_note_from_file.js "title" "/path/to/file.md" [--type note|research|meeting-notes|decision-log|weekly-report|knowledge-card|plan|report]
 */
const fs = require('fs');
const NotionAPI = require('./notion_api.js');
const { parseDocumentOptions } = require('./document_cli.js');
const { buildDocumentSpecFromMarkdown } = require('./document_designer.js');
const {
  documentSpecToBlocks,
  documentSpecToPageOptions,
} = require('./document_renderer.js');

const title = process.argv[2];
const filePath = process.argv[3];
let options = {};

try {
  options = parseDocumentOptions(process.argv.slice(4));
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

if (!title || !filePath) {
  console.error('Usage: node create_note_from_file.js "title" "/path/to/file.md" [options]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const rootPage = await api.findRootPage();
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const spec = buildDocumentSpecFromMarkdown({
    title,
    markdown,
    ...options,
  });
  const blocks = documentSpecToBlocks(spec);
  const page = await api.createPageSafe(
    rootPage.id,
    title,
    blocks,
    documentSpecToPageOptions(spec)
  );

  console.log('OK');
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
