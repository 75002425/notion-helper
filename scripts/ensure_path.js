#!/usr/bin/env node
/**
 * Ensure a nested Notion page path exists under the authorized root page.
 * Usage: node ensure_path.js "Research/Strategy/Reviews"
 */
const NotionAPI = require('./notion_api.js');
const { ensurePagePath } = require('./path_utils.js');

const pagePath = process.argv[2];

if (!pagePath) {
  console.error('Usage: node ensure_path.js "page/path"');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const page = await ensurePagePath(api, pagePath);

  console.log('OK');
  console.log('PAGE_ID:', page.id);
  if (page.url) {
    console.log('URL:', page.url);
  }
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
