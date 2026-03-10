#!/usr/bin/env node
/**
 * Search Notion pages by keyword.
 * Usage: node search.js ["keyword"]
 */
const NotionAPI = require('./notion_api.js');

const query = process.argv[2] || '';

(async () => {
  const api = new NotionAPI();
  const result = await api.search(query, 'page', 20);

  if (!result.results || result.results.length === 0) {
    console.log('No matching pages found');
    return;
  }

  result.results.forEach((p, i) => {
    const title = p.properties?.title?.title?.[0]?.text?.content || '(untitled)';
    const parentType = p.parent?.type || 'unknown';
    console.log(`${i + 1}. ${title}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Parent: ${parentType}`);
    console.log(`   URL: ${p.url}`);
  });
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
