#!/usr/bin/env node
/**
 * Move a page below a target path.
 * Usage: node move_page.js "page-id-or-title" "Research/Strategy"
 */
const NotionAPI = require('./notion_api.js');
const { ensurePagePath } = require('./path_utils.js');
const { resolvePageReference } = require('./page_utils.js');

const pageRef = process.argv[2];
const pagePath = process.argv[3];

if (!pageRef || !pagePath) {
  console.error('Usage: node move_page.js "page-id-or-title" "target/path"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const page = await resolvePageReference(api, pageRef);
  const targetParent = await ensurePagePath(api, pagePath);

  await api.movePage(page.id, targetParent.id);

  console.log('OK');
  console.log('PAGE_ID:', page.id);
  console.log('TARGET_PARENT_ID:', targetParent.id);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
