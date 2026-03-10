#!/usr/bin/env node
/**
 * Create a Notion page under the authorized root page.
 * Usage: node create_note.js "title" ["markdown content"]
 */
const NotionAPI = require('./notion_api.js');
const { textToBlocks } = require('./formatter.js');

const title = process.argv[2];
const content = process.argv[3] || '';

if (!title) {
  console.error('Usage: node create_note.js "title" "content (optional)"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const rootPage = await api.findRootPage();
  const blocks = content ? textToBlocks(content) : [];
  const page = await api.createPageSafe(rootPage.id, title, blocks);

  console.log('OK');
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
