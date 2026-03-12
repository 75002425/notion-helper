#!/usr/bin/env node
/**
 * Create a structured Notion document from a JSON spec file in a nested path.
 * Usage: node create_structured_note_from_file_in_path.js "Research/Strategy" "/path/to/spec.json"
 */
const fs = require('fs');

const NotionAPI = require('./notion_api.js');
const {
  documentSpecToBlocks,
  documentSpecToPageOptions,
  normalizeDocumentSpec,
} = require('./document_renderer.js');
const { ensurePagePath } = require('./path_utils.js');

const pagePath = process.argv[2];
const filePath = process.argv[3];

if (!pagePath || !filePath) {
  console.error('Usage: node create_structured_note_from_file_in_path.js "page/path" "/path/to/spec.json"');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const parentPage = await ensurePagePath(api, pagePath);
  const spec = normalizeDocumentSpec(JSON.parse(fs.readFileSync(filePath, 'utf-8')));

  if (!spec.title) {
    throw new Error('Structured spec must include a title.');
  }

  const blocks = documentSpecToBlocks(spec);
  const page = await api.createPageSafe(
    parentPage.id,
    spec.title,
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
