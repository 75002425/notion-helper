const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPageTree, formatPageTree } = require('../scripts/tree_utils.js');

test('buildPageTree returns nested structure up to requested depth', async () => {
  const rootPage = { id: 'root', title: 'Root' };
  const childrenByParent = new Map([
    ['root', [
      { id: 'research', title: '调研' },
      { id: 'product', title: '产品' },
    ]],
    ['research', [
      { id: 'openclaw', title: 'OpenClaw' },
    ]],
    ['openclaw', [
      { id: 'memory', title: '记忆增强' },
    ]],
  ]);

  const api = {
    async findRootPage() {
      return rootPage;
    },
    async listChildPages(parentId) {
      return childrenByParent.get(parentId) || [];
    },
  };

  const tree = await buildPageTree(api, { maxDepth: 3 });

  assert.equal(tree.title, 'Root');
  assert.equal(tree.children[0].title, '调研');
  assert.equal(tree.children[0].children[0].title, 'OpenClaw');
  assert.equal(tree.children[0].children[0].children[0].title, '记忆增强');
});

test('formatPageTree keeps only matching branches when keyword filter is provided', async () => {
  const rootPage = { id: 'root', title: 'Root' };
  const childrenByParent = new Map([
    ['root', [
      { id: 'research', title: '调研' },
      { id: 'product', title: '产品' },
    ]],
    ['research', [
      { id: 'openclaw', title: 'OpenClaw' },
    ]],
    ['openclaw', [
      { id: 'memory', title: '记忆增强' },
    ]],
    ['product', [
      { id: 'roadmap', title: 'Roadmap' },
    ]],
  ]);

  const api = {
    async findRootPage() {
      return rootPage;
    },
    async listChildPages(parentId) {
      return childrenByParent.get(parentId) || [];
    },
  };

  const tree = await buildPageTree(api, { maxDepth: 3, keyword: '记忆' });
  const formatted = formatPageTree(tree);

  assert.match(formatted, /调研/);
  assert.match(formatted, /OpenClaw/);
  assert.match(formatted, /记忆增强/);
  assert.doesNotMatch(formatted, /产品/);
  assert.doesNotMatch(formatted, /Roadmap/);
});
