/**
 * Build a nested page tree from the authorized root page.
 * @param {Object} api - Notion API client
 * @param {Object} options - Tree options
 * @param {number} options.maxDepth - Maximum depth from root
 * @param {string} options.keyword - Optional keyword filter
 * @returns {Promise<Object>} Tree root
 */
async function buildPageTree(api, options = {}) {
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 2;
  const keyword = String(options.keyword || '').trim();
  const rootPage = await api.findRootPage();
  const tree = await buildNode(api, rootPage, 0, maxDepth);

  if (!keyword) {
    return tree;
  }

  return filterTree(tree, keyword) || {
    id: tree.id,
    title: tree.title,
    url: tree.url,
    children: [],
  };
}

async function buildNode(api, page, depth, maxDepth) {
  const node = {
    id: page.id,
    title: page.title || '(untitled)',
    url: page.url || '',
    children: [],
  };

  if (depth >= maxDepth) {
    return node;
  }

  const children = await api.listChildPages(page.id);
  for (const child of children) {
    node.children.push(await buildNode(api, child, depth + 1, maxDepth));
  }

  return node;
}

function filterTree(node, keyword) {
  const filteredChildren = (node.children || [])
    .map(child => filterTree(child, keyword))
    .filter(Boolean);
  const matched = node.title.includes(keyword);

  if (!matched && filteredChildren.length === 0) {
    return null;
  }

  return {
    ...node,
    children: filteredChildren,
  };
}

/**
 * Format a page tree as plain text.
 * @param {Object} tree - Tree root
 * @returns {string} Formatted tree
 */
function formatPageTree(tree) {
  const lines = [];
  appendTreeLines(lines, tree, 0);
  return lines.join('\n');
}

function appendTreeLines(lines, node, depth) {
  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '' : '- ';
  lines.push(`${indent}${prefix}${node.title}`);

  (node.children || []).forEach(child => {
    appendTreeLines(lines, child, depth + 1);
  });
}

module.exports = {
  buildPageTree,
  formatPageTree,
};
