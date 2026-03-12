#!/usr/bin/env node
/**
 * Notion API Client - Node.js version
 * Zero external dependencies, uses Node.js built-in modules only
 */

const https = require('https');
const { URL } = require('url');

class NotionAPI {
  constructor() {
    this.apiKey = process.env.NOTION_API_KEY;
    if (!this.apiKey) {
      throw new Error(
        'NOTION_API_KEY not found. Please set the environment variable first.\n' +
        'Windows: [System.Environment]::SetEnvironmentVariable(\'NOTION_API_KEY\', \'your_key\', \'User\')\n' +
        'Linux/Mac: export NOTION_API_KEY=\'your_key\''
      );
    }

    this.baseUrl = 'https://api.notion.com/v1';
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    };
  }

  /**
   * Unified HTTP request method with retry and chunked reading.
   * @private
   * @param {string} url - Request URL
   * @param {string} method - HTTP method (GET/POST/PATCH/DELETE)
   * @param {Object|null} data - Request body data
   * @param {number} maxRetries - Maximum retry count
   * @returns {Promise<Object>} API response data
   */
  async _request(url, method = 'GET', data = null, maxRetries = 3) {
    const urlObj = new URL(url);

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        return await new Promise((resolve, reject) => {
          const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method,
            headers: this.headers,
            timeout: 60000,
          };

          const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
              const body = Buffer.concat(chunks).toString('utf-8');

              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(body ? JSON.parse(body) : {});
                } catch (error) {
                  reject(new Error(`JSON parsing failed: ${error.message}`));
                }
                return;
              }

              reject(new Error(`Notion API error ${res.statusCode}: ${body}`));
            });
          });

          req.on('error', error => reject(error));
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          if (data) {
            req.write(JSON.stringify(data));
          }

          req.end();
        });
      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        throw new Error(`Network error after ${maxRetries} retries: ${error.message}`);
      }
    }

    throw new Error('Unreachable state in request retry loop.');
  }

  /**
   * Search pages and databases.
   * @param {string} query - Search keyword
   * @param {string|null} filterType - Filter type ('page' or 'database')
   * @param {number} pageSize - Result count (max 100)
   * @returns {Promise<Object>} Search result
   */
  async search(query = '', filterType = null, pageSize = 20) {
    const payload = {
      query,
      page_size: pageSize,
    };

    if (filterType) {
      payload.filter = { property: 'object', value: filterType };
    }

    return this._request(`${this.baseUrl}/search`, 'POST', payload);
  }

  /**
   * Get child blocks of a block.
   * @param {string} blockId - Block ID
   * @param {string|null} startCursor - Pagination cursor
   * @returns {Promise<Object>} Child blocks list
   */
  async getBlockChildren(blockId, startCursor = null) {
    const cleanId = blockId.replace(/-/g, '');
    const query = startCursor ? `&start_cursor=${encodeURIComponent(startCursor)}` : '';
    return this._request(
      `${this.baseUrl}/blocks/${cleanId}/children?page_size=100${query}`,
      'GET'
    );
  }

  /**
   * List direct child pages under a parent page.
   * @param {string} parentId - Parent page ID
   * @returns {Promise<Array>} Child page descriptors
   */
  async listChildPages(parentId) {
    const childPages = [];
    let cursor = null;

    do {
      const result = await this.getBlockChildren(parentId, cursor);
      const blocks = result.results || [];

      for (const block of blocks) {
        if (block.type === 'child_page' && block.child_page) {
          childPages.push({
            id: block.id,
            title: block.child_page.title || '',
            url: block.url,
            parent: {
              type: 'page_id',
              page_id: parentId.replace(/-/g, ''),
            },
          });
        }
      }

      cursor = result.has_more ? result.next_cursor : null;
    } while (cursor);

    return childPages;
  }

  /**
   * Find a direct child page by exact title match under a parent page.
   * @param {string} parentId - Parent page ID
   * @param {string} title - Child page title
   * @returns {Promise<Object|null>} Matching child page or null
   */
  async findChildPageByTitle(parentId, title) {
    const expectedTitle = String(title || '').trim();
    if (!expectedTitle) {
      throw new Error('Child page title must not be empty.');
    }

    const childPages = await this.listChildPages(parentId);
    return childPages.find(page => page.title.trim() === expectedTitle) || null;
  }

  /**
   * Create a page.
   * @param {string} parentId - Parent page ID
   * @param {string} title - Page title
   * @param {Array} blocks - Initial child blocks
   * @param {Object} options - Page options
   * @param {string} options.icon - Emoji icon
   * @param {string} options.cover - External cover URL
   * @returns {Promise<Object>} Created page object
   */
  async createPage(parentId, title, blocks = [], options = {}) {
    const payload = {
      parent: { page_id: parentId.replace(/-/g, '') },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
      children: blocks.slice(0, 100),
    };

    if (options.icon) {
      payload.icon = { type: 'emoji', emoji: options.icon };
    }

    if (options.cover) {
      payload.cover = {
        type: 'external',
        external: { url: options.cover },
      };
    }

    return this._request(`${this.baseUrl}/pages`, 'POST', payload);
  }

  /**
   * Append blocks to a page or block.
   * @param {string} blockId - Block ID
   * @param {Array} blocks - Blocks to append
   * @returns {Promise<Object>} Append result
   */
  async appendBlocks(blockId, blocks) {
    const cleanId = blockId.replace(/-/g, '');
    return this._request(`${this.baseUrl}/blocks/${cleanId}/children`, 'PATCH', {
      children: blocks,
    });
  }

  /**
   * Update a block.
   * @param {string} blockId - Block ID
   * @param {Object} content - New block content
   * @returns {Promise<Object>} Updated block object
   */
  async updateBlock(blockId, content) {
    const cleanId = blockId.replace(/-/g, '');
    return this._request(`${this.baseUrl}/blocks/${cleanId}`, 'PATCH', content);
  }

  /**
   * Delete a block.
   * @param {string} blockId - Block ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteBlock(blockId) {
    const cleanId = blockId.replace(/-/g, '');
    return this._request(`${this.baseUrl}/blocks/${cleanId}`, 'DELETE');
  }

  /**
   * Archive a page.
   * @param {string} pageId - Page ID
   * @returns {Promise<Object>} Updated page
   */
  async archivePage(pageId) {
    const cleanId = pageId.replace(/-/g, '');
    return this._request(`${this.baseUrl}/pages/${cleanId}`, 'PATCH', { archived: true });
  }

  /**
   * Move a page to a new parent page.
   * @param {string} pageId - Page ID to move
   * @param {string} newParentPageId - Target parent page ID
   * @returns {Promise<Object>} Move result
   */
  async movePage(pageId, newParentPageId) {
    const cleanId = pageId.replace(/-/g, '');
    return this._request(`${this.baseUrl}/pages/${cleanId}/move`, 'POST', {
      parent: { page_id: newParentPageId.replace(/-/g, '') },
    });
  }

  /**
   * Find the authorized root page (parent.type === 'workspace').
   * @returns {Promise<Object>} Root page object
   */
  async findRootPage() {
    const result = await this.search('', 'page', 100);
    if (!result.results || result.results.length === 0) {
      throw new Error('No authorized pages found. Please authorize pages to the integration in Notion first.');
    }

    const rootPage = result.results.find(page => page.parent && page.parent.type === 'workspace');
    if (!rootPage) {
      throw new Error('No root page found (parent.type === workspace). Please check integration authorization.');
    }

    return rootPage;
  }

  /**
   * Create a page with automatic batching for blocks exceeding the 100 block limit.
   * @param {string} parentId - Parent page ID
   * @param {string} title - Page title
   * @param {Array} blocks - Child blocks array
   * @param {Object} options - Page options
   * @returns {Promise<Object>} Created page object
   */
  async createPageSafe(parentId, title, blocks = [], options = {}) {
    const page = await this.createPage(parentId, title, blocks.slice(0, 100), options);

    for (let i = 100; i < blocks.length; i += 100) {
      await this.appendBlocks(page.id, blocks.slice(i, i + 100));
    }

    return page;
  }
}

module.exports = NotionAPI;
