#!/usr/bin/env node
/**
 * Append content to an existing Notion page.
 * Usage: node append.js "page ID or title" "markdown content"
 */
const NotionAPI = require('./notion_api.js');
const { textToBlocks } = require('./formatter.js');
const { resolvePageReference } = require('./page_utils.js');

const pageIdOrTitle = process.argv[2];
const content = process.argv[3];

if (!pageIdOrTitle || !content) {
  console.error('Usage: node append.js "page ID or title" "content"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const page = await resolvePageReference(api, pageIdOrTitle);
  const pageId = page.id;

  const blocks = textToBlocks(content);

  for (let i = 0; i < blocks.length; i += 100) {
    const batch = blocks.slice(i, i + 100);
    await api.appendBlocks(pageId, batch);
  }

  console.log('OK');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
