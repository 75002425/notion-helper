#!/usr/bin/env node
/**
 * Create a Notion page from a Markdown file.
 * Usage: node create_note_from_file.js "title" "/path/to/file.md"
 */
const NotionAPI = require('./notion_api.js');
const { textToBlocks } = require('./formatter.js');
const fs = require('fs');

const title = process.argv[2];
const filePath = process.argv[3];

if (!title || !filePath) {
  console.error('Usage: node create_note_from_file.js "title" "/path/to/file.md"');
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
  const blocks = textToBlocks(markdown);
  const page = await api.createPageSafe(rootPage.id, title, blocks);

  console.log('OK');
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
