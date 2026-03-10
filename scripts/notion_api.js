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
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    };
  }

  /**
   * Unified HTTP request method with retry and chunked reading
   * @private
   * @param {string} url - Request URL
   * @param {string} method - HTTP method (GET/POST/PATCH/DELETE)
   * @param {Object|null} data - Request body data
   * @param {number} maxRetries - Maximum retry count
   * @returns {Promise<Object>} API response data
   * @throws {Error} Network error or API error
   */
  async _request(url, method = 'GET', data = null, maxRetries = 3) {
    const urlObj = new URL(url);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await new Promise((resolve, reject) => {
          const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: this.headers,
            timeout: 60000
          };

          const req = https.request(options, (res) => {
            const chunks = [];

            res.on('data', (chunk) => chunks.push(chunk));

            res.on('end', () => {
              const body = Buffer.concat(chunks).toString('utf-8');

              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(new Error(`JSON parsing failed: ${e.message}`));
                }
              } else {
                reject(new Error(`Notion API error ${res.statusCode}: ${body}`));
              }
            });
          });

          req.on('error', (e) => reject(e));
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
  }

  /**
   * Search pages and databases
   * @param {string} query - Search keyword, empty string returns all accessible content
   * @param {string|null} filterType - Filter type ('page' or 'database')
   * @param {number} pageSize - Result count (max 100)
   * @returns {Promise<Object>} Search results containing results array
   */
  async search(query = '', filterType = null, pageSize = 20) {
    const url = `${this.baseUrl}/search`;
    const payload = { query, page_size: pageSize };

    if (filterType) {
      payload.filter = { property: 'object', value: filterType };
    }

    return await this._request(url, 'POST', payload);
  }

  /**
   * Get child blocks of a block
   * @param {string} blockId - Block ID (with or without hyphens)
   * @returns {Promise<Object>} Child blocks list with results array
   */
  async getBlockChildren(blockId) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}/children?page_size=100`;
    return await this._request(url, 'GET');
  }

  /**
   * Create a page
   * @param {string} parentId - Parent page ID
   * @param {string} title - Page title
   * @param {Array} blocks - Child blocks array (max 100)
   * @returns {Promise<Object>} Created page object
   */
  async createPage(parentId, title, blocks = []) {
    const url = `${this.baseUrl}/pages`;
    const payload = {
      parent: { page_id: parentId.replace(/-/g, '') },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        }
      },
      children: blocks.slice(0, 100)
    };

    return await this._request(url, 'POST', payload);
  }

  /**
   * Append blocks to a page or block
   * @param {string} blockId - Block ID
   * @param {Array} blocks - Blocks to append
   * @returns {Promise<Object>} Append result
   */
  async appendBlocks(blockId, blocks) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}/children`;
    const payload = { children: blocks };

    return await this._request(url, 'PATCH', payload);
  }

  /**
   * Update a block
   * @param {string} blockId - Block ID
   * @param {Object} content - New block content
   * @returns {Promise<Object>} Updated block object
   */
  async updateBlock(blockId, content) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}`;
    return await this._request(url, 'PATCH', content);
  }

  /**
   * Delete a block
   * @param {string} blockId - Block ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteBlock(blockId) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}`;
    return await this._request(url, 'DELETE');
  }

  /**
   * Find the authorized root page (parent.type === 'workspace').
   * This is the top-level page bound to the Notion integration.
   * All new content should be created under this page.
   * @returns {Promise<Object>} Root page object
   * @throws {Error} If no root page is found
   */
  async findRootPage() {
    const result = await this.search('', 'page', 100);
    if (!result.results || result.results.length === 0) {
      throw new Error('No authorized pages found. Please authorize pages to the integration in Notion first.');
    }

    const rootPage = result.results.find(p => p.parent && p.parent.type === 'workspace');
    if (!rootPage) {
      throw new Error('No root page found (parent.type === workspace). Please check integration authorization.');
    }

    return rootPage;
  }

  /**
   * Create a page with automatic batching for blocks exceeding 100 limit
   * @param {string} parentId - Parent page ID
   * @param {string} title - Page title
   * @param {Array} blocks - Child blocks array (no limit, auto-batched)
   * @returns {Promise<Object>} Created page object
   */
  async createPageSafe(parentId, title, blocks = []) {
    const page = await this.createPage(parentId, title, blocks.slice(0, 100));

    for (let i = 100; i < blocks.length; i += 100) {
      const batch = blocks.slice(i, i + 100);
      await this.appendBlocks(page.id, batch);
    }

    return page;
  }
}

module.exports = NotionAPI;
