#!/usr/bin/env node
/**
 * Notion 内容格式化工具
 * 将 Markdown 文本转换为 Notion 块格式
 */

/**
 * 构造富文本对象
 * @param {string} text - 文本内容
 * @param {Object} options - 格式选项
 * @param {boolean} options.bold - 粗体
 * @param {boolean} options.code - 代码
 * @param {boolean} options.italic - 斜体
 * @param {string} options.color - 颜色
 * @param {string} options.url - 链接
 * @returns {Object} 富文本对象
 */
function rich(text, options = {}) {
  const { bold, code, italic, color, url } = options;
  const result = { type: 'text', text: { content: text } };

  if (url) {
    result.text.link = { url };
  }

  const annotations = {};
  if (bold) annotations.bold = true;
  if (code) annotations.code = true;
  if (italic) annotations.italic = true;
  if (color) annotations.color = color;

  if (Object.keys(annotations).length > 0) {
    result.annotations = annotations;
  }

  return result;
}

/**
 * 将 Markdown 风格文本转换为 Notion 块列表
 *
 * 支持的格式：
 * - # / ## / ###  → heading_1 / heading_2 / heading_3
 * - - 或 *        → bulleted_list_item
 * - 1. 2. 3.     → numbered_list_item
 * - > 引用        → quote
 * - --- 或 ***    → divider
 * - 其他          → paragraph
 *
 * @param {string} text - Markdown 文本
 * @returns {Array} Notion 块数组
 */
function textToBlocks(text) {
  const lines = text.trim().split('\n');
  const blocks = [];

  for (const line of lines) {
    const stripped = line.trim();
    if (!stripped) continue;

    // 分隔线
    if (['---', '***', '___'].includes(stripped)) {
      blocks.push(createDivider());
    }
    // 标题
    else if (stripped.startsWith('### ')) {
      blocks.push(createHeading(3, stripped.slice(4)));
    }
    else if (stripped.startsWith('## ')) {
      blocks.push(createHeading(2, stripped.slice(3)));
    }
    else if (stripped.startsWith('# ')) {
      blocks.push(createHeading(1, stripped.slice(2)));
    }
    // 引用
    else if (stripped.startsWith('> ')) {
      blocks.push(createQuote(stripped.slice(2)));
    }
    // 有序列表
    else if (/^\d+[.）]/.test(stripped)) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: stripped.slice(2).trim() } }]
        }
      });
    }
    // 无序列表
    else if (stripped.startsWith('- ') || stripped.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: stripped.slice(2) } }]
        }
      });
    }
    // 段落
    else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: stripped } }]
        }
      });
    }
  }

  return blocks;
}

/**
 * 创建标题块
 * @param {number} level - 标题级别 (1-3)
 * @param {string} text - 标题文本
 * @returns {Object} 标题块
 */
function createHeading(level, text) {
  const key = `heading_${level}`;
  return {
    object: 'block',
    type: key,
    [key]: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

/**
 * 创建提示框
 * @param {string} text - 提示文本
 * @param {string} emoji - emoji 图标
 * @param {string} color - 颜色
 * @returns {Object} 提示框块
 */
function createCallout(text, emoji = '💡', color = 'default') {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: text } }],
      icon: { type: 'emoji', emoji },
      color
    }
  };
}

/**
 * 创建代码块
 * @param {string} code - 代码内容
 * @param {string} language - 编程语言
 * @returns {Object} 代码块
 */
function createCodeBlock(code, language = 'javascript') {
  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: [{ type: 'text', text: { content: code } }],
      language
    }
  };
}

/**
 * 创建分隔线
 * @returns {Object} 分隔线块
 */
function createDivider() {
  return { object: 'block', type: 'divider', divider: {} };
}

/**
 * 创建目录
 * @returns {Object} 目录块
 */
function createToc() {
  return {
    object: 'block',
    type: 'table_of_contents',
    table_of_contents: { color: 'gray' }
  };
}

/**
 * 创建折叠块
 * @param {string} title - 折叠块标题
 * @param {Array} children - 子块数组
 * @returns {Object} 折叠块
 */
function createToggle(title, children) {
  return {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: title } }],
      children
    }
  };
}

/**
 * 创建引用块
 * @param {string} text - 引用文本
 * @returns {Object} 引用块
 */
function createQuote(text) {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

/**
 * 创建书签
 * @param {string} url - 书签 URL
 * @param {string} caption - 说明文字
 * @returns {Object} 书签块
 */
function createBookmark(url, caption = '') {
  const block = {
    object: 'block',
    type: 'bookmark',
    bookmark: { url }
  };

  if (caption) {
    block.bookmark.caption = [{ type: 'text', text: { content: caption } }];
  }

  return block;
}

module.exports = {
  rich,
  textToBlocks,
  createHeading,
  createCallout,
  createCodeBlock,
  createDivider,
  createToc,
  createToggle,
  createQuote,
  createBookmark
};
