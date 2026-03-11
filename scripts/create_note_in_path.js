#!/usr/bin/env node
/**
 * Create a Notion page under a nested path below the authorized root page.
 * Usage: node create_note_in_path.js "Research/Strategy" "title" ["markdown content"]
 */
const NotionAPI = require('./notion_api.js');
const { textToBlocks } = require('./formatter.js');
const { ensurePagePath } = require('./path_utils.js');

const pagePath = process.argv[2];
const title = process.argv[3];
const content = process.argv[4] || '';

if (!pagePath || !title) {
  console.error('Usage: node create_note_in_path.js "page/path" "title" "content (optional)"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const parentPage = await ensurePagePath(api, pagePath);
  const blocks = content ? textToBlocks(content) : [];
  const page = await api.createPageSafe(parentPage.id, title, blocks);

  console.log('OK');
  console.log('PAGE_ID:', page.id);
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
