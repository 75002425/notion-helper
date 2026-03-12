const test = require('node:test');
const assert = require('node:assert/strict');

const { splitPagePath, ensurePagePath } = require('../scripts/path_utils.js');

test('splitPagePath trims segments and drops empty items', () => {
  assert.deepEqual(
    splitPagePath(' Research / Strategy // Mean Reversion / '),
    ['Research', 'Strategy', 'Mean Reversion']
  );
});

test('splitPagePath removes adjacent duplicate levels', () => {
  assert.deepEqual(
    splitPagePath('Research/Research/OpenClaw/openclaw/Notes'),
    ['Research', 'OpenClaw', 'Notes']
  );
});

test('splitPagePath rejects empty paths', () => {
  assert.throws(() => splitPagePath('  /  //   '), /Path must contain at least one page name/);
});

test('ensurePagePath reuses existing pages and creates missing levels', async () => {
  const rootPage = { id: 'root', title: 'Root' };
  const created = [];
  const existing = new Map([
    ['root::Research', { id: 'research', title: 'Research' }],
  ]);

  const api = {
    async findRootPage() {
      return rootPage;
    },
    async findChildPageByTitle(parentId, title) {
      return existing.get(`${parentId}::${title}`) || null;
    },
    async createPageSafe(parentId, title, blocks) {
      assert.deepEqual(blocks, []);
      const page = { id: `${parentId}-${title}`, title };
      created.push({ parentId, title });
      existing.set(`${parentId}::${title}`, page);
      return page;
    },
  };

  const target = await ensurePagePath(api, 'Research/Strategy/Reviews');

  assert.equal(target.id, 'research-Strategy-Reviews');
  assert.deepEqual(created, [
    { parentId: 'research', title: 'Strategy' },
    { parentId: 'research-Strategy', title: 'Reviews' },
  ]);
});

test('ensurePagePath returns existing final page without creating anything', async () => {
  const rootPage = { id: 'root', title: 'Root' };
  const existing = new Map([
    ['root::Research', { id: 'research', title: 'Research' }],
    ['research::Strategy', { id: 'strategy', title: 'Strategy' }],
  ]);
  let createCalls = 0;

  const api = {
    async findRootPage() {
      return rootPage;
    },
    async findChildPageByTitle(parentId, title) {
      return existing.get(`${parentId}::${title}`) || null;
    },
    async createPageSafe() {
      createCalls += 1;
      throw new Error('should not create pages');
    },
  };

  const target = await ensurePagePath(api, 'Research/Strategy');

  assert.equal(target.id, 'strategy');
  assert.equal(createCalls, 0);
});
