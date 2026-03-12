#!/usr/bin/env node
/**
 * Print the current authorized page tree.
 * Usage:
 *   node inspect_tree.js
 *   node inspect_tree.js --max-depth 3
 *   node inspect_tree.js --max-depth 4 --keyword "memory"
 */
const NotionAPI = require('./notion_api.js');
const { buildPageTree, formatPageTree } = require('./tree_utils.js');

const args = parseArgs(process.argv.slice(2));

(async () => {
  const api = new NotionAPI();
  const tree = await buildPageTree(api, {
    maxDepth: args.maxDepth,
    keyword: args.keyword,
  });

  console.log('OK');
  console.log('ROOT_PAGE_ID:', tree.id);
  console.log(formatPageTree(tree));
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

function parseArgs(argv) {
  const result = {
    maxDepth: 2,
    keyword: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--max-depth') {
      result.maxDepth = Number(argv[i + 1] || 2);
      i += 1;
      continue;
    }

    if (arg === '--keyword') {
      result.keyword = argv[i + 1] || '';
      i += 1;
    }
  }

  return result;
}
