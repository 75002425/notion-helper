#!/usr/bin/env node
/**
 * Create a structured Notion document from a JSON spec file.
 * Usage: node create_structured_note_from_file.js "/path/to/spec.json"
 */
const fs = require('fs');

const NotionAPI = require('./notion_api.js');
const {
  documentSpecToBlocks,
  documentSpecToPageOptions,
  normalizeDocumentSpec,
} = require('./document_renderer.js');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node create_structured_note_from_file.js "/path/to/spec.json"');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const rootPage = await api.findRootPage();
  const spec = normalizeDocumentSpec(JSON.parse(fs.readFileSync(filePath, 'utf-8')));

  if (!spec.title) {
    throw new Error('Structured spec must include a title.');
  }

  const blocks = documentSpecToBlocks(spec);
  const page = await api.createPageSafe(
    rootPage.id,
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
