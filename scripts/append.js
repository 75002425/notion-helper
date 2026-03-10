#!/usr/bin/env node
/**
 * Append content to an existing Notion page.
 * Usage: node append.js "page ID or title" "markdown content"
 */
const NotionAPI = require('./notion_api.js');
const { textToBlocks } = require('./formatter.js');

const pageIdOrTitle = process.argv[2];
const content = process.argv[3];

if (!pageIdOrTitle || !content) {
  console.error('Usage: node append.js "page ID or title" "content"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  let pageId = pageIdOrTitle;

  // If not a UUID, search by title
  if (!/^[a-f0-9-]{32,36}$/i.test(pageIdOrTitle)) {
    const result = await api.search(pageIdOrTitle, 'page', 5);
    if (!result.results || result.results.length === 0) {
      console.error('No matching page found');
      process.exit(1);
    }
    pageId = result.results[0].id;
  }

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
