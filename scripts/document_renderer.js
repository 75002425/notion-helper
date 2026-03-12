const {
  createBookmark,
  createBulletedListItem,
  createCallout,
  createDivider,
  createHeading,
  createParagraph,
  createToc,
  createTodoItem,
  createToggle,
  textToBlocks,
} = require('./formatter.js');

const DOC_TYPE_ALIASES = {
  meeting: 'meeting-notes',
  meeting_notes: 'meeting-notes',
  decision: 'decision-log',
  decision_log: 'decision-log',
  weekly: 'weekly-report',
  weekly_report: 'weekly-report',
  knowledge: 'knowledge-card',
  knowledge_card: 'knowledge-card',
};

const DOC_TYPE_DEFAULTS = {
  note: {
    icon: '📘',
    summary_label: 'Summary',
    summary_color: 'blue_background',
    key_findings_label: 'Key points',
    decision_label: 'Focus',
    decision_color: 'blue_background',
    section_callout_color: 'gray_background',
  },
  research: {
    icon: '🔬',
    summary_label: 'Executive summary',
    summary_color: 'yellow_background',
    key_findings_label: 'Key findings',
    decision_label: 'Recommendation',
    decision_color: 'green_background',
    section_callout_color: 'gray_background',
  },
  'meeting-notes': {
    icon: '📝',
    summary_label: 'Meeting summary',
    summary_color: 'blue_background',
    key_findings_label: 'Highlights',
    decision_label: 'Key decision',
    decision_color: 'green_background',
    section_callout_color: 'gray_background',
  },
  'decision-log': {
    icon: '⚖️',
    summary_label: 'Decision summary',
    summary_color: 'yellow_background',
    key_findings_label: 'Options considered',
    decision_label: 'Decision',
    decision_color: 'green_background',
    section_callout_color: 'gray_background',
  },
  'weekly-report': {
    icon: '📆',
    summary_label: 'Week summary',
    summary_color: 'blue_background',
    key_findings_label: 'This week at a glance',
    decision_label: 'Top focus',
    decision_color: 'green_background',
    section_callout_color: 'gray_background',
  },
  'knowledge-card': {
    icon: '🧠',
    summary_label: 'What it is',
    summary_color: 'green_background',
    key_findings_label: 'Key points',
    decision_label: 'When to use',
    decision_color: 'blue_background',
    section_callout_color: 'gray_background',
  },
  plan: {
    icon: '🧭',
    summary_label: 'Plan summary',
    summary_color: 'blue_background',
    key_findings_label: 'Key points',
    decision_label: 'Plan direction',
    decision_color: 'green_background',
    section_callout_color: 'gray_background',
  },
  report: {
    icon: '📊',
    summary_label: 'Executive summary',
    summary_color: 'blue_background',
    key_findings_label: 'Key findings',
    decision_label: 'Bottom line',
    decision_color: 'green_background',
    section_callout_color: 'gray_background',
  },
};

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeDocType(value) {
  const raw = normalizeString(value || 'note').toLowerCase();
  return DOC_TYPE_ALIASES[raw] || raw || 'note';
}

function normalizeStringList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(item => normalizeString(item))
    .filter(Boolean);
}

function normalizeSections(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(item => ({
      heading: normalizeString(item?.heading || item?.title),
      summary: normalizeString(item?.summary),
      callout: normalizeString(item?.callout),
      callout_color: normalizeString(item?.callout_color || item?.accent_color),
      callout_icon: normalizeString(item?.callout_icon),
      content_markdown: normalizeString(
        item?.content_markdown || item?.content || item?.markdown
      ),
    }))
    .filter(
      item =>
        item.heading ||
        item.summary ||
        item.callout ||
        item.content_markdown
    );
}

function normalizeReferences(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map(item => ({
      title: normalizeString(item?.title),
      url: normalizeString(item?.url),
    }))
    .filter(item => item.title && item.url);
}

/**
 * Normalize a structured document spec into a stable schema.
 * @param {Object} input - Raw document spec
 * @returns {Object} Normalized document spec
 */
function normalizeDocumentSpec(input = {}) {
  const docType = normalizeDocType(input.doc_type || 'note');
  const defaults = DOC_TYPE_DEFAULTS[docType] || DOC_TYPE_DEFAULTS.note;

  return {
    title: normalizeString(input.title),
    doc_type: docType,
    icon: normalizeString(input.icon) || defaults.icon,
    cover: normalizeString(input.cover),
    summary_label: normalizeString(input.summary_label) || defaults.summary_label,
    summary: normalizeString(input.summary),
    status: normalizeString(input.status),
    owner: normalizeString(input.owner),
    updated_at: normalizeString(input.updated_at || input.updatedAt),
    tags: normalizeStringList(input.tags),
    key_findings: normalizeStringList(input.key_findings || input.highlights),
    decision_label: normalizeString(input.decision_label) || defaults.decision_label,
    decision: normalizeString(input.decision),
    open_questions: normalizeStringList(input.open_questions),
    sections: normalizeSections(input.sections),
    risks: normalizeStringList(input.risks),
    next_actions: normalizeStringList(input.next_actions),
    references: normalizeReferences(input.references),
    appendix: normalizeSections(input.appendix),
  };
}

/**
 * Convert a structured document spec to page options.
 * @param {Object} rawSpec - Raw or normalized document spec
 * @returns {Object} Page options
 */
function documentSpecToPageOptions(rawSpec) {
  const spec = normalizeDocumentSpec(rawSpec);
  const options = {};

  if (spec.icon) {
    options.icon = spec.icon;
  }

  if (spec.cover) {
    options.cover = spec.cover;
  }

  return options;
}

/**
 * Convert a structured document spec to Notion blocks.
 * @param {Object} rawSpec - Raw or normalized document spec
 * @returns {Array} Notion blocks
 */
function documentSpecToBlocks(rawSpec) {
  const spec = normalizeDocumentSpec(rawSpec);
  const defaults = DOC_TYPE_DEFAULTS[spec.doc_type] || DOC_TYPE_DEFAULTS.note;
  const blocks = [];
  const summaryText = spec.summary
    ? `**${spec.summary_label}:** ${spec.summary}`
    : `**${spec.summary_label}:** Structured document generated for ${spec.title || 'this page'}.`;

  blocks.push(createCallout(summaryText, spec.icon, defaults.summary_color));

  const metadataText = buildMetadataText(spec);
  if (metadataText) {
    blocks.push(createCallout(metadataText, '🗂️', 'gray_background'));
  }

  blocks.push(createToc());

  if (spec.key_findings.length > 0) {
    blocks.push(createHeading(2, defaults.key_findings_label));
    spec.key_findings.forEach(item => {
      blocks.push(createBulletedListItem(item));
    });
  }

  if (spec.decision) {
    blocks.push(createHeading(2, spec.decision_label));
    blocks.push(createCallout(spec.decision, '✅', defaults.decision_color));
  }

  if (spec.open_questions.length > 0) {
    blocks.push(createHeading(2, 'Open questions'));
    spec.open_questions.forEach(item => {
      blocks.push(createBulletedListItem(item));
    });
  }

  spec.sections.forEach((section, index) => {
    blocks.push(createHeading(2, section.heading || `Section ${index + 1}`));

    if (section.summary) {
      blocks.push(createCallout(section.summary, '🧭', 'gray_background'));
    }

    if (section.callout) {
      blocks.push(
        createCallout(
          section.callout,
          section.callout_icon || '💡',
          section.callout_color || defaults.section_callout_color
        )
      );
    }

    appendMarkdownBlocks(blocks, section.content_markdown);
  });

  if (spec.risks.length > 0) {
    blocks.push(createHeading(2, 'Risks and constraints'));
    spec.risks.forEach(item => {
      blocks.push(createCallout(item, '⚠️', 'orange_background'));
    });
  }

  if (spec.next_actions.length > 0) {
    blocks.push(createHeading(2, 'Next actions'));
    spec.next_actions.forEach(item => {
      blocks.push(createTodoItem(item));
    });
  }

  if (spec.references.length > 0) {
    blocks.push(createHeading(2, 'References'));
    spec.references.forEach(item => {
      blocks.push(createBookmark(item.url, item.title));
    });
  }

  if (spec.appendix.length > 0) {
    blocks.push(createHeading(2, 'Appendix'));
    spec.appendix.forEach(section => {
      const children = buildAppendixChildren(section);
      blocks.push(createToggle(section.heading || 'Appendix', children));
    });
  }

  trimTrailingDividers(blocks);
  return blocks;
}

function buildMetadataText(spec) {
  const parts = [];

  if (spec.status) {
    parts.push(`**Status:** ${spec.status}`);
  }

  if (spec.owner) {
    parts.push(`**Owner:** ${spec.owner}`);
  }

  if (spec.updated_at) {
    parts.push(`**Updated:** ${spec.updated_at}`);
  }

  if (spec.tags.length > 0) {
    parts.push(`**Tags:** ${spec.tags.join(', ')}`);
  }

  return parts.join(' | ');
}

function buildAppendixChildren(section) {
  const children = [];

  if (section.summary) {
    children.push(createCallout(section.summary, '📝', 'gray_background'));
  }

  if (section.callout) {
    children.push(
      createCallout(
        section.callout,
        section.callout_icon || '💡',
        section.callout_color || 'gray_background'
      )
    );
  }

  const markdownBlocks = textToBlocks(section.content_markdown);
  if (markdownBlocks.length > 0) {
    children.push(...markdownBlocks);
  }

  if (children.length === 0) {
    children.push(createParagraph('No appendix content.'));
  }

  return children;
}

function appendMarkdownBlocks(blocks, markdown) {
  const markdownBlocks = textToBlocks(markdown);
  if (markdownBlocks.length === 0) {
    blocks.push(createParagraph('Content to be added.'));
  } else {
    blocks.push(...markdownBlocks);
  }

  blocks.push(createDivider());
}

function trimTrailingDividers(blocks) {
  while (blocks.length > 0 && blocks[blocks.length - 1].type === 'divider') {
    blocks.pop();
  }
}

module.exports = {
  DOC_TYPE_ALIASES,
  DOC_TYPE_DEFAULTS,
  normalizeDocumentSpec,
  documentSpecToBlocks,
  documentSpecToPageOptions,
};
