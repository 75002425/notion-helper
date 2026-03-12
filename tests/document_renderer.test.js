const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DOC_TYPE_ALIASES,
  normalizeDocumentSpec,
  documentSpecToBlocks,
  documentSpecToPageOptions,
} = require('../scripts/document_renderer.js');

test('normalizeDocumentSpec applies defaults for canonicalized doc types', () => {
  const spec = normalizeDocumentSpec({
    title: 'Weekly memory update',
    doc_type: 'weekly_report',
    summary: 'Focus on durable memory workflows.',
    tags: ['memory', 'openclaw'],
  });

  assert.equal(DOC_TYPE_ALIASES.weekly_report, 'weekly-report');
  assert.equal(spec.doc_type, 'weekly-report');
  assert.equal(spec.icon, '📆');
  assert.equal(spec.summary_label, 'Week summary');
  assert.deepEqual(spec.tags, ['memory', 'openclaw']);
});

test('documentSpecToBlocks renders a structured, beautified document', () => {
  const spec = normalizeDocumentSpec({
    title: 'OpenClaw memory skill review',
    doc_type: 'research',
    summary: 'Select one durable memory skill first and keep the stack small.',
    status: 'Draft',
    owner: 'Codex',
    updated_at: '2026-03-11',
    tags: ['memory', 'skills'],
    key_findings: [
      'Install claw-control first.',
      'Add notion-helper only if a long-form output destination is required.',
    ],
    decision: 'Start with claw-control and keep notion-helper as an optional publishing layer.',
    open_questions: ['Does OpenClaw already expose a first-party long-term memory workflow?'],
    sections: [
      {
        heading: 'Evaluation scope',
        summary: 'Compare setup cost, durability, and operational overhead.',
        callout: 'Bias toward the smallest install footprint that still preserves memory.',
        callout_color: 'blue_background',
        content_markdown: '## Candidates\n- claw-control\n- notion-helper',
      },
    ],
    risks: ['Over-installing tools increases maintenance cost.'],
    next_actions: ['Run a one-week pilot.'],
    references: [
      {
        title: 'Memory docs',
        url: 'https://example.com/memory',
      },
    ],
    appendix: [
      {
        heading: 'Raw notes',
        content_markdown: '- note 1',
      },
    ],
  });

  const blocks = documentSpecToBlocks(spec);
  const types = blocks.map(block => block.type);
  const orangeCallout = blocks.find(
    block => block.type === 'callout' && block.callout.color === 'orange_background'
  );

  assert.equal(types[0], 'callout');
  assert.equal(types[1], 'callout');
  assert.ok(types.includes('table_of_contents'));
  assert.ok(types.includes('heading_2'));
  assert.ok(types.includes('bulleted_list_item'));
  assert.ok(types.includes('to_do'));
  assert.ok(types.includes('bookmark'));
  assert.ok(types.includes('toggle'));
  assert.ok(orangeCallout);
});

test('documentSpecToPageOptions returns icon and cover settings', () => {
  const options = documentSpecToPageOptions({
    title: 'Decision log',
    doc_type: 'decision-log',
    cover: 'https://example.com/cover.png',
  });

  assert.deepEqual(options, {
    icon: '⚖️',
    cover: 'https://example.com/cover.png',
  });
});
