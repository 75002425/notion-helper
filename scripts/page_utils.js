/**
 * Check whether a value looks like a Notion page UUID.
 * @param {string} value - Candidate page reference
 * @returns {boolean} Whether the value looks like a page id
 */
function isPageId(value) {
  return /^[a-f0-9-]{32,36}$/i.test(String(value || '').trim());
}

/**
 * Extract the plain title from a Notion page result.
 * @param {Object} page - Notion page object
 * @returns {string} Page title
 */
function getPageTitle(page) {
  return page?.properties?.title?.title
    ?.map(item => item?.plain_text || item?.text?.content || '')
    .join('') || '(untitled)';
}

/**
 * Resolve a page reference by id or title search.
 * @param {Object} api - Notion API client
 * @param {string} pageRef - Page id or title
 * @returns {Promise<Object>} Resolved page object
 */
async function resolvePageReference(api, pageRef) {
  const rawRef = String(pageRef || '').trim();
  if (!rawRef) {
    throw new Error('Page reference must not be empty.');
  }

  if (isPageId(rawRef)) {
    return { id: rawRef };
  }

  const result = await api.search(rawRef, 'page', 10);
  const pages = (result.results || []).map(page => ({
    ...page,
    title: getPageTitle(page),
  }));

  if (pages.length === 0) {
    throw new Error(`No matching page found for "${rawRef}".`);
  }

  const exactMatches = pages.filter(page => page.title.trim() === rawRef);
  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1 || pages.length > 1) {
    throw new Error(`Multiple pages matched "${rawRef}". Search first and use a page ID.`);
  }

  return pages[0];
}

module.exports = {
  isPageId,
  getPageTitle,
  resolvePageReference,
};
