/**
 * Split a page path into normalized page title segments.
 * Supports "/" and "\" as separators.
 * @param {string} pagePath - Raw page path
 * @returns {string[]} Path segments
 */
function splitPagePath(pagePath) {
  const rawSegments = String(pagePath || '')
    .split(/[\\/]/)
    .map(segment => segment.trim())
    .filter(Boolean);

  const segments = rawSegments.filter((segment, index) => {
    if (index === 0) {
      return true;
    }

    return segment.toLowerCase() !== rawSegments[index - 1].toLowerCase();
  });

  if (segments.length === 0) {
    throw new Error('Path must contain at least one page name.');
  }

  return segments;
}

/**
 * Ensure a nested path of child pages exists under the authorized root page.
 * Reuses existing child pages by exact title match and creates missing levels.
 * @param {Object} api - Notion API client
 * @param {string} pagePath - Page path such as "Research/Strategy/Reviews"
 * @returns {Promise<Object>} Final page in the ensured path
 */
async function ensurePagePath(api, pagePath) {
  const segments = splitPagePath(pagePath);
  let currentPage = await api.findRootPage();

  for (const segment of segments) {
    let childPage = await api.findChildPageByTitle(currentPage.id, segment);
    if (!childPage) {
      childPage = await api.createPageSafe(currentPage.id, segment, []);
    }
    currentPage = childPage;
  }

  return currentPage;
}

module.exports = {
  splitPagePath,
  ensurePagePath,
};
