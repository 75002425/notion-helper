#!/usr/bin/env node
/**
 * Notion content formatter
 * Converts Markdown text to Notion block format
 */

/**
 * Build a rich text object
 * @param {string} text - Text content
 * @param {Object} options - Formatting options
 * @param {boolean} options.bold - Bold
 * @param {boolean} options.code - Code
 * @param {boolean} options.italic - Italic
 * @param {string} options.color - Color
 * @param {string} options.url - Link URL
 * @returns {Object} Rich text object
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
 * Build a standard Notion block with rich_text.
 * @param {string} type - Block type
 * @param {Array} richText - Rich text array
 * @param {Object} extra - Extra block properties
 * @returns {Object} Notion block
 */
function createRichTextBlock(type, richText, extra = {}) {
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: richText,
      ...extra,
    },
  };
}

/**
 * Parse inline Markdown formatting into Notion rich_text array
 * Supports: **bold**, *italic*, `code`, [text](url)
 * @param {string} text - Markdown line text
 * @returns {Array} rich_text array
 */
function parseInlineFormatting(text) {
  const richTexts = [];
  const safeText = String(text || '');
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(safeText)) !== null) {
    if (match.index > lastIndex) {
      richTexts.push(rich(safeText.slice(lastIndex, match.index)));
    }

    if (match[2]) {
      richTexts.push(rich(match[2], { bold: true }));
    } else if (match[4]) {
      richTexts.push(rich(match[4], { italic: true }));
    } else if (match[6]) {
      richTexts.push(rich(match[6], { code: true }));
    } else if (match[8] && match[9]) {
      richTexts.push(rich(match[8], { url: match[9] }));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < safeText.length) {
    richTexts.push(rich(safeText.slice(lastIndex)));
  }

  if (richTexts.length === 0) {
    richTexts.push(rich(safeText));
  }

  return richTexts;
}

/**
 * Parse Markdown table lines into a Notion table block
 * @param {string[]} tableLines - Table lines (header, separator, data rows)
 * @returns {Object|null} Notion table block or null
 */
function parseTable(tableLines) {
  const rows = [];

  for (const line of tableLines) {
    const trimmed = line.trim();
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;

    const cells = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

    rows.push({
      type: 'table_row',
      table_row: {
        cells: cells.map(cell => [{ type: 'text', text: { content: cell } }]),
      },
    });
  }

  if (rows.length === 0) return null;

  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: rows[0].table_row.cells.length,
      has_column_header: true,
      has_row_header: false,
      children: rows,
    },
  };
}

/**
 * Map unsupported language names to Notion-supported ones.
 * Notion only accepts a specific set of language identifiers for code blocks.
 */
const LANG_MAP = {
  jsx: 'javascript',
  tsx: 'typescript',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  objc: 'objective-c',
  cs: 'c#',
  cpp: 'c++',
  fs: 'f#',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  tf: 'hcl',
  dockerfile: 'docker',
  text: 'plain text',
  txt: 'plain text',
  '': 'plain text',
};

/**
 * Normalize a language identifier to a Notion-supported value.
 * @param {string} lang - Language from markdown code fence
 * @returns {string} Notion-supported language
 */
function normalizeLang(lang) {
  const lower = String(lang || '').toLowerCase().trim();
  return LANG_MAP[lower] || lower || 'plain text';
}

/**
 * Create a paragraph block.
 * @param {string} text - Paragraph content
 * @returns {Object} Paragraph block
 */
function createParagraph(text) {
  return createRichTextBlock('paragraph', parseInlineFormatting(text));
}

/**
 * Create a bulleted list item block.
 * @param {string} text - Item text
 * @returns {Object} Bulleted list block
 */
function createBulletedListItem(text) {
  return createRichTextBlock('bulleted_list_item', parseInlineFormatting(text));
}

/**
 * Create a numbered list item block.
 * @param {string} text - Item text
 * @returns {Object} Numbered list block
 */
function createNumberedListItem(text) {
  return createRichTextBlock('numbered_list_item', parseInlineFormatting(text));
}

/**
 * Create a to-do block.
 * @param {string} text - To-do text
 * @param {boolean} checked - Whether item is completed
 * @returns {Object} To-do block
 */
function createTodoItem(text, checked = false) {
  return createRichTextBlock('to_do', parseInlineFormatting(text), { checked });
}

/**
 * Create a heading block
 * @param {number} level - Heading level (1-3)
 * @param {string} text - Heading text
 * @returns {Object} Heading block
 */
function createHeading(level, text) {
  const key = `heading_${level}`;
  return createRichTextBlock(key, [{ type: 'text', text: { content: text } }]);
}

/**
 * Create a callout block
 * @param {string} text - Callout text
 * @param {string} emoji - Emoji icon
 * @param {string} color - Color
 * @returns {Object} Callout block
 */
function createCallout(text, emoji = '💡', color = 'default') {
  return createCalloutFromRichText(parseInlineFormatting(text), emoji, color);
}

/**
 * Create a callout block from rich text.
 * @param {Array} richText - Rich text content
 * @param {string} emoji - Emoji icon
 * @param {string} color - Color
 * @returns {Object} Callout block
 */
function createCalloutFromRichText(richText, emoji = '💡', color = 'default') {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: richText,
      icon: { type: 'emoji', emoji },
      color,
    },
  };
}

/**
 * Create a code block
 * Automatically splits content into multiple rich_text chunks if exceeding 2000 char limit.
 * @param {string} code - Code content
 * @param {string} language - Programming language
 * @returns {Object} Code block
 */
function createCodeBlock(code, language = 'javascript') {
  const chunks = [];
  const safeCode = String(code || '');
  const maxLen = 2000;

  for (let i = 0; i < safeCode.length; i += maxLen) {
    chunks.push({ type: 'text', text: { content: safeCode.slice(i, i + maxLen) } });
  }

  if (chunks.length === 0) {
    chunks.push({ type: 'text', text: { content: '' } });
  }

  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: chunks,
      language,
    },
  };
}

/**
 * Create a divider block
 * @returns {Object} Divider block
 */
function createDivider() {
  return { object: 'block', type: 'divider', divider: {} };
}

/**
 * Create a table of contents block
 * @returns {Object} TOC block
 */
function createToc() {
  return {
    object: 'block',
    type: 'table_of_contents',
    table_of_contents: { color: 'gray' },
  };
}

/**
 * Create a toggle block
 * @param {string} title - Toggle title
 * @param {Array} children - Child blocks
 * @returns {Object} Toggle block
 */
function createToggle(title, children) {
  return {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: title } }],
      children,
    },
  };
}

/**
 * Create a quote block
 * @param {string} text - Quote text
 * @returns {Object} Quote block
 */
function createQuote(text) {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

/**
 * Create a bookmark block
 * @param {string} url - Bookmark URL
 * @param {string} caption - Caption text
 * @returns {Object} Bookmark block
 */
function createBookmark(url, caption = '') {
  const block = {
    object: 'block',
    type: 'bookmark',
    bookmark: { url },
  };

  if (caption) {
    block.bookmark.caption = [{ type: 'text', text: { content: caption } }];
  }

  return block;
}

/**
 * Convert Markdown text to Notion block array.
 *
 * Supported formats:
 * - # / ## / ###  -> heading_1 / heading_2 / heading_3
 * - - or *        -> bulleted_list_item
 * - 1. 2. 3.      -> numbered_list_item
 * - > quote       -> quote
 * - --- or ***    -> divider
 * - ```lang```    -> code block
 * - | col | ...   -> table
 * - other         -> paragraph
 *
 * @param {string} text - Markdown text
 * @returns {Array} Notion block array
 */
function textToBlocks(text) {
  const safeText = String(text || '').trim();
  if (!safeText) {
    return [];
  }

  const lines = safeText.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const stripped = line.trim();

    if (!stripped) {
      i += 1;
      continue;
    }

    if (stripped.startsWith('```')) {
      const lang = normalizeLang(stripped.slice(3));
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(createCodeBlock(codeLines.join('\n'), lang));
      continue;
    }

    if (stripped.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const table = parseTable(tableLines);
      if (table) {
        blocks.push(table);
      }
      continue;
    }

    if (['---', '***', '___'].includes(stripped)) {
      blocks.push(createDivider());
      i += 1;
      continue;
    }

    if (stripped.startsWith('### ')) {
      blocks.push(createHeading(3, stripped.slice(4)));
      i += 1;
      continue;
    }

    if (stripped.startsWith('## ')) {
      blocks.push(createHeading(2, stripped.slice(3)));
      i += 1;
      continue;
    }

    if (stripped.startsWith('# ')) {
      blocks.push(createHeading(1, stripped.slice(2)));
      i += 1;
      continue;
    }

    if (stripped.startsWith('> ')) {
      blocks.push(createQuote(stripped.slice(2)));
      i += 1;
      continue;
    }

    const orderedMatch = stripped.match(/^(\d+)[.)]\s+(.+)/);
    if (orderedMatch) {
      blocks.push(createNumberedListItem(orderedMatch[2]));
      i += 1;
      continue;
    }

    if (stripped.startsWith('- ') || stripped.startsWith('* ')) {
      blocks.push(createBulletedListItem(stripped.slice(2)));
      i += 1;
      continue;
    }

    blocks.push(createParagraph(stripped));
    i += 1;
  }

  return blocks;
}

module.exports = {
  rich,
  createRichTextBlock,
  parseInlineFormatting,
  parseTable,
  normalizeLang,
  textToBlocks,
  createParagraph,
  createBulletedListItem,
  createNumberedListItem,
  createTodoItem,
  createHeading,
  createCallout,
  createCalloutFromRichText,
  createCodeBlock,
  createDivider,
  createToc,
  createToggle,
  createQuote,
  createBookmark,
};
