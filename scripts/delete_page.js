#!/usr/bin/env node
/**
 * Archive a Notion page.
 * Usage: node delete_page.js "page-id-or-title"
 */
const NotionAPI = require('./notion_api.js');
const { resolvePageReference } = require('./page_utils.js');

const pageRef = process.argv[2];

if (!pageRef) {
  console.error('Usage: node delete_page.js "page-id-or-title"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const page = await resolvePageReference(api, pageRef);
  await api.archivePage(page.id);

  console.log('OK');
  console.log('PAGE_ID:', page.id);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
