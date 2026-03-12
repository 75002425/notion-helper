const { normalizeDocumentSpec } = require('./document_renderer.js');

const SPECIAL_SECTION_ALIASES = {
  summary: [
    'summary',
    'overview',
    'executive summary',
    'tl dr',
    'tldr',
    'abstract',
    '\u6458\u8981',
    '\u6982\u89c8',
    '\u6982\u8ff0',
    '\u7ed3\u8bba\u5148\u884c',
  ],
  key_findings: [
    'key findings',
    'key takeaways',
    'takeaways',
    'highlights',
    'conclusions',
    '\u5173\u952e\u7ed3\u8bba',
    '\u6838\u5fc3\u7ed3\u8bba',
    '\u8981\u70b9',
    '\u4eae\u70b9',
  ],
  decision: [
    'decision',
    'recommendation',
    'recommended approach',
    'bottom line',
    '\u51b3\u7b56',
    '\u5efa\u8bae',
    '\u63a8\u8350\u65b9\u6848',
    '\u7ed3\u8bba',
  ],
  risks: [
    'risks',
    'risk',
    'constraints',
    'caveats',
    'warnings',
    'watchouts',
    '\u98ce\u9669',
    '\u7ea6\u675f',
    '\u6ce8\u610f\u4e8b\u9879',
    '\u98ce\u9669\u4e0e\u7ea6\u675f',
  ],
  next_actions: [
    'next actions',
    'next steps',
    'action items',
    'todo',
    'to do',
    '\u540e\u7eed\u52a8\u4f5c',
    '\u4e0b\u4e00\u6b65',
    '\u884c\u52a8\u9879',
    '\u5f85\u529e',
  ],
  references: [
    'references',
    'reference',
    'sources',
    'links',
    '\u76f8\u5173\u94fe\u63a5',
    '\u53c2\u8003',
    '\u53c2\u8003\u8d44\u6599',
    '\u6765\u6e90',
  ],
  appendix: [
    'appendix',
    'faq',
    'details',
    'raw notes',
    'supplement',
    '\u9644\u5f55',
    '\u8865\u5145\u6750\u6599',
    '\u539f\u6587',
    '\u7ec6\u8282',
  ],
  open_questions: [
    'open questions',
    'questions',
    'unknowns',
    'open items',
    '\u5f85\u786e\u8ba4',
    '\u5f85\u9a8c\u8bc1',
    '\u5f00\u653e\u95ee\u9898',
    '\u672a\u51b3\u95ee\u9898',
  ],
};

/**
 * Build a structured document spec from Markdown plus optional metadata.
 * @param {Object} input - Markdown document input
 * @returns {Object} Normalized document spec
 */
function buildDocumentSpecFromMarkdown(input = {}) {
  const parsed = parseFrontMatter(input.markdown || input.content || '');
  const metadata = mergeMetadata(parsed.metadata, input);
  const split = splitMarkdownIntoSections(parsed.body);
  const spec = {
    title: metadata.title,
    doc_type: metadata.doc_type,
    icon: metadata.icon,
    cover: metadata.cover,
    summary: metadata.summary,
    status: metadata.status,
    owner: metadata.owner,
    updated_at: metadata.updated_at,
    tags: metadata.tags,
    decision: metadata.decision,
    key_findings: normalizeStringList(metadata.key_findings),
    open_questions: normalizeStringList(metadata.open_questions),
    risks: normalizeStringList(metadata.risks),
    next_actions: normalizeStringList(metadata.next_actions),
    references: Array.isArray(metadata.references) ? metadata.references.slice() : [],
    appendix: Array.isArray(metadata.appendix) ? metadata.appendix.slice() : [],
    sections: [],
  };

  let preamble = split.preamble;
  if (!spec.summary) {
    const intro = extractLeadParagraph(preamble, 260);
    if (intro) {
      spec.summary = intro.text;
      preamble = intro.remaining;
    }
  }

  if (!spec.summary) {
    const intro = extractLeadParagraph(parsed.body, 260);
    if (intro) {
      spec.summary = intro.text;
    }
  }

  if (preamble) {
    spec.sections.push({
      heading: defaultIntroHeading(spec.doc_type),
      content_markdown: normalizeMarkdownDensity(preamble),
    });
  }

  split.sections.forEach(section => {
    const sectionType = classifyHeading(section.heading);
    const denseContent = normalizeMarkdownDensity(section.content_markdown);

    if (sectionType === 'summary') {
      spec.summary = spec.summary || extractPlainText(denseContent);
      return;
    }

    if (sectionType === 'key_findings') {
      spec.key_findings.push(...extractBulletLikeItems(denseContent));
      return;
    }

    if (sectionType === 'decision') {
      spec.decision = spec.decision || extractPlainText(denseContent);
      return;
    }

    if (sectionType === 'risks') {
      spec.risks.push(...extractBulletLikeItems(denseContent));
      return;
    }

    if (sectionType === 'next_actions') {
      spec.next_actions.push(...extractChecklistItems(denseContent));
      return;
    }

    if (sectionType === 'references') {
      spec.references.push(...extractReferences(denseContent));
      return;
    }

    if (sectionType === 'appendix') {
      spec.appendix.push({
        heading: section.heading,
        content_markdown: denseContent,
      });
      return;
    }

    if (sectionType === 'open_questions') {
      spec.open_questions.push(...extractBulletLikeItems(denseContent));
      return;
    }

    spec.sections.push(buildDesignedSection(section.heading, denseContent));
  });

  if (spec.sections.length === 0 && split.sections.length === 0 && parsed.body.trim()) {
    const content = normalizeMarkdownDensity(parsed.body);
    if (content) {
      spec.sections.push({
        heading: defaultContentHeading(spec.doc_type),
        content_markdown: content,
      });
    }
  }

  if (!spec.summary) {
    spec.summary = buildFallbackSummary(spec);
  }

  spec.key_findings = uniqStrings(spec.key_findings);
  spec.open_questions = uniqStrings(spec.open_questions);
  spec.risks = uniqStrings(spec.risks);
  spec.next_actions = uniqStrings(spec.next_actions);
  spec.references = uniqReferences(spec.references);

  return normalizeDocumentSpec(spec);
}

function shouldUseDesignedDocument(markdown, options = {}) {
  const text = normalizeLineEndings(markdown);

  if (!text) {
    return hasMeaningfulOptions(options);
  }

  return (
    hasMeaningfulOptions(options) ||
    text.length > 280 ||
    text.includes('\n') ||
    /^(#{1,3}|\- |\* |\d+[.)]\s+)/m.test(text)
  );
}

function mergeMetadata(frontMatter, input) {
  return {
    title: normalizeString(input.title || frontMatter.title),
    doc_type: normalizeString(
      input.doc_type || input.type || frontMatter.doc_type || frontMatter.type || 'note'
    ),
    icon: normalizeString(input.icon || frontMatter.icon),
    cover: normalizeString(input.cover || frontMatter.cover),
    summary: normalizeString(input.summary || frontMatter.summary),
    status: normalizeString(input.status || frontMatter.status),
    owner: normalizeString(
      input.owner ||
      input.author ||
      frontMatter.owner ||
      frontMatter.author ||
      frontMatter.source
    ),
    updated_at: normalizeString(
      input.updated_at || frontMatter.updated_at || frontMatter.updated
    ),
    tags: mergeTags(frontMatter.tags, input.tags),
    decision: normalizeString(input.decision || frontMatter.decision),
    key_findings: mergeLists(frontMatter.key_findings, input.key_findings),
    open_questions: mergeLists(frontMatter.open_questions, input.open_questions),
    risks: mergeLists(frontMatter.risks, input.risks),
    next_actions: mergeLists(frontMatter.next_actions, input.next_actions),
    references: mergeLists(frontMatter.references, input.references),
    appendix: mergeLists(frontMatter.appendix, input.appendix),
  };
}

function parseFrontMatter(markdown) {
  const text = normalizeLineEndings(markdown);

  if (!text.startsWith('---\n')) {
    return {
      metadata: {},
      body: text.trim(),
    };
  }

  const endIndex = text.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return {
      metadata: {},
      body: text.trim(),
    };
  }

  const rawFrontMatter = text.slice(4, endIndex).trim();
  const body = text.slice(endIndex + 5).trim();
  const metadata = {};

  rawFrontMatter.split('\n').forEach(line => {
    const separator = line.indexOf(':');
    if (separator === -1) {
      return;
    }

    const key = normalizeMetadataKey(line.slice(0, separator));
    const value = line.slice(separator + 1).trim();
    metadata[key] = parseMetadataValue(key, value);
  });

  return { metadata, body };
}

function normalizeMetadataKey(key) {
  return normalizeString(key).toLowerCase().replace(/-/g, '_');
}

function parseMetadataValue(key, value) {
  if (['tags', 'key_findings', 'open_questions', 'risks', 'next_actions'].includes(key)) {
    return value
      .split(',')
      .map(item => normalizeString(item))
      .filter(Boolean);
  }

  return normalizeString(value);
}

function splitMarkdownIntoSections(markdown) {
  const lines = normalizeLineEndings(markdown).split('\n');
  const sections = [];
  const preambleLines = [];
  let current = null;

  lines.forEach(line => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (!match) {
      if (current) {
        current.lines.push(line);
      } else {
        preambleLines.push(line);
      }
      return;
    }

    if (current) {
      sections.push({
        heading: current.heading,
        content_markdown: current.lines.join('\n').trim(),
      });
    }

    current = {
      heading: normalizeString(match[2]),
      lines: [],
    };
  });

  if (current) {
    sections.push({
      heading: current.heading,
      content_markdown: current.lines.join('\n').trim(),
    });
  }

  return {
    preamble: preambleLines.join('\n').trim(),
    sections: sections.filter(section => section.heading || section.content_markdown),
  };
}

function classifyHeading(heading) {
  const normalized = normalizeHeading(heading);

  for (const [sectionType, aliases] of Object.entries(SPECIAL_SECTION_ALIASES)) {
    if (aliases.some(alias => normalizeHeading(alias) === normalized)) {
      return sectionType;
    }
  }

  return null;
}

function normalizeHeading(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[`*_:#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDesignedSection(heading, markdown) {
  const intro = extractLeadParagraph(markdown, 180);

  if (!intro || !intro.remaining) {
    return {
      heading,
      content_markdown: markdown,
    };
  }

  return {
    heading,
    summary: intro.text,
    content_markdown: intro.remaining,
  };
}

function defaultIntroHeading(docType) {
  const type = normalizeString(docType).toLowerCase();

  if (type === 'meeting-notes') {
    return 'Context';
  }

  if (type === 'knowledge-card') {
    return 'Details';
  }

  return 'Overview';
}

function defaultContentHeading(docType) {
  const type = normalizeString(docType).toLowerCase();

  if (type === 'weekly-report') {
    return 'Report';
  }

  if (type === 'knowledge-card') {
    return 'Notes';
  }

  return 'Details';
}

function extractLeadParagraph(markdown, maxLength) {
  const blocks = splitIntoBlocks(markdown);

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (!isPlainParagraph(block) || block.length > maxLength) {
      continue;
    }

    const remainingBlocks = blocks.filter((_, blockIndex) => blockIndex !== index);
    return {
      text: normalizeInlineText(block),
      remaining: remainingBlocks.join('\n\n').trim(),
    };
  }

  return null;
}

function splitIntoBlocks(markdown) {
  return normalizeLineEndings(markdown)
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean);
}

function isPlainParagraph(block) {
  const firstLine = normalizeLineEndings(block).split('\n')[0].trim();

  if (!firstLine) {
    return false;
  }

  return !(
    firstLine.startsWith('#') ||
    firstLine.startsWith('>') ||
    firstLine.startsWith('|') ||
    firstLine.startsWith('```') ||
    firstLine.startsWith('- ') ||
    firstLine.startsWith('* ') ||
    /^\d+[.)]\s+/.test(firstLine) ||
    /^\[[ xX]\]\s+/.test(firstLine)
  );
}

function normalizeMarkdownDensity(markdown) {
  const blocks = splitIntoBlocks(markdown);

  return blocks
    .flatMap(block => {
      if (!isPlainParagraph(block) || block.length <= 320) {
        return [block];
      }

      const sentences = block
        .split(/(?<=[.!?\u3002\uFF01\uFF1F])\s+/)
        .filter(Boolean);

      if (sentences.length < 2) {
        return [block];
      }

      const chunks = [];
      let current = '';

      sentences.forEach(sentence => {
        const next = current ? `${current} ${sentence}` : sentence;
        if (next.length > 220 && current) {
          chunks.push(current.trim());
          current = sentence;
          return;
        }

        current = next;
      });

      if (current) {
        chunks.push(current.trim());
      }

      return chunks;
    })
    .join('\n\n')
    .trim();
}

function extractPlainText(markdown) {
  return normalizeInlineText(
    splitIntoBlocks(markdown)
      .slice(0, 2)
      .join(' ')
  );
}

function extractBulletLikeItems(markdown) {
  const items = [];

  normalizeLineEndings(markdown)
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      const bulletMatch = trimmed.match(/^([-*]|\d+[.)]|\[[ xX]\])\s+(.+)$/);
      if (bulletMatch) {
        items.push(normalizeInlineText(bulletMatch[2]));
      }
    });

  if (items.length > 0) {
    return uniqStrings(items);
  }

  return splitIntoBlocks(markdown)
    .map(block => normalizeInlineText(block))
    .filter(Boolean);
}

function extractChecklistItems(markdown) {
  const items = [];

  normalizeLineEndings(markdown)
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      const match = trimmed.match(/^(\[[ xX]\]|[-*]|\d+[.)])\s+(.+)$/);
      if (match) {
        items.push(normalizeInlineText(match[2]));
      }
    });

  return uniqStrings(items);
}

function extractReferences(markdown) {
  const references = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    references.push({
      title: normalizeInlineText(match[1]),
      url: normalizeString(match[2]),
    });
  }

  normalizeLineEndings(markdown)
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      const bareUrlMatch = trimmed.match(/^(https?:\/\/\S+)$/);
      if (!bareUrlMatch) {
        return;
      }

      references.push({
        title: bareUrlMatch[1],
        url: bareUrlMatch[1],
      });
    });

  return uniqReferences(references);
}

function buildFallbackSummary(spec) {
  if (spec.key_findings.length > 0) {
    return spec.key_findings.slice(0, 2).join(' ');
  }

  if (spec.sections.length > 0) {
    const section = spec.sections[0];
    return section.summary || extractPlainText(section.content_markdown) || spec.title;
  }

  return spec.title || 'Structured document generated from Markdown content.';
}

function normalizeInlineText(value) {
  return normalizeString(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeStringList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(item => normalizeString(item))
    .filter(Boolean);
}

function mergeLists(primary, secondary) {
  return []
    .concat(Array.isArray(primary) ? primary : [])
    .concat(Array.isArray(secondary) ? secondary : []);
}

function mergeTags(frontMatterTags, inputTags) {
  return uniqStrings(
    normalizeStringList(
      []
        .concat(Array.isArray(frontMatterTags) ? frontMatterTags : [])
        .concat(Array.isArray(inputTags) ? inputTags : [])
        .flat()
    )
  );
}

function uniqStrings(items) {
  const seen = new Set();
  const result = [];

  items.forEach(item => {
    const value = normalizeString(item);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(value);
  });

  return result;
}

function uniqReferences(items) {
  const seen = new Set();
  const result = [];

  items.forEach(item => {
    const title = normalizeString(item?.title);
    const url = normalizeString(item?.url);
    const key = `${title.toLowerCase()}::${url.toLowerCase()}`;

    if (!title || !url || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push({ title, url });
  });

  return result;
}

function normalizeLineEndings(text) {
  return String(text || '').replace(/\r\n/g, '\n').trim();
}

function hasMeaningfulOptions(options) {
  return Object.values(options).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  });
}

module.exports = {
  buildDocumentSpecFromMarkdown,
  parseFrontMatter,
  splitMarkdownIntoSections,
  classifyHeading,
  normalizeMarkdownDensity,
  shouldUseDesignedDocument,
};
