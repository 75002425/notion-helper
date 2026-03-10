#!/usr/bin/env node
/**
 * Notion API 客户端 - Node.js 版本
 * 零外部依赖，使用 Node.js 内置模块
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
   * 统一的 HTTP 请求方法，带重试机制和分块读取
   * @private
   * @param {string} url - 请求 URL
   * @param {string} method - HTTP 方法 (GET/POST/PATCH/DELETE)
   * @param {Object|null} data - 请求体数据
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<Object>} API 响应数据
   * @throws {Error} 网络错误或 API 错误
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
   * 搜索页面和数据库
   * @param {string} query - 搜索关键词，空字符串返回所有可访问内容
   * @param {string|null} filterType - 过滤类型 ('page' 或 'database')
   * @param {number} pageSize - 返回结果数量 (最大100)
   * @returns {Promise<Object>} 搜索结果，包含 results 数组
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
   * 获取块的子内容
   * @param {string} blockId - 块 ID（支持带或不带连字符）
   * @returns {Promise<Object>} 包含 results 数组的子块列表
   */
  async getBlockChildren(blockId) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}/children?page_size=100`;
    return await this._request(url, 'GET');
  }

  /**
   * 创建页面
   * @param {string} parentId - 父页面 ID
   * @param {string} title - 页面标题
   * @param {Array} blocks - 子块数组（最多100个）
   * @returns {Promise<Object>} 创建的页面对象
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
   * 追加块内容
   * @param {string} blockId - 块 ID
   * @param {Array} blocks - 要追加的块数组
   * @returns {Promise<Object>} 追加结果
   */
  async appendBlocks(blockId, blocks) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}/children`;
    const payload = { children: blocks };

    return await this._request(url, 'PATCH', payload);
  }

  /**
   * 更新块内容
   * @param {string} blockId - 块 ID
   * @param {Object} content - 新的块内容
   * @returns {Promise<Object>} 更新后的块对象
   */
  async updateBlock(blockId, content) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}`;
    return await this._request(url, 'PATCH', content);
  }

  /**
   * 删除块
   * @param {string} blockId - 块 ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteBlock(blockId) {
    const cleanId = blockId.replace(/-/g, '');
    const url = `${this.baseUrl}/blocks/${cleanId}`;
    return await this._request(url, 'DELETE');
  }
}

module.exports = NotionAPI;
