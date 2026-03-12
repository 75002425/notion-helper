const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDocumentSpecFromMarkdown,
  classifyHeading,
  parseFrontMatter,
} = require('../scripts/document_designer.js');

test('parseFrontMatter extracts simple metadata and body', () => {
  const parsed = parseFrontMatter(`---
doc_type: weekly-report
summary: Short summary
tags: memory, openclaw
---
# Body
Content`);

  assert.equal(parsed.metadata.doc_type, 'weekly-report');
  assert.deepEqual(parsed.metadata.tags, ['memory', 'openclaw']);
  assert.match(parsed.body, /# Body/);
});

test('classifyHeading recognizes English and Chinese semantic sections', () => {
  assert.equal(classifyHeading('Key Takeaways'), 'key_findings');
  assert.equal(classifyHeading('风险与约束'), 'risks');
  assert.equal(classifyHeading('下一步'), 'next_actions');
});

test('buildDocumentSpecFromMarkdown converts markdown into a designed document spec', () => {
  const spec = buildDocumentSpecFromMarkdown({
    title: 'Knowledge card',
    doc_type: 'knowledge-card',
    markdown: `---
tags: memory, retrieval
---
This card explains how retrieval memory should work in OpenClaw.

## Key Takeaways
- Keep the memory layer small
- Prefer explicit retrieval triggers

## Risks
- Hidden automation is hard to debug

## References
- [Memory design](https://example.com/design)

## Example workflow
Retrieval should happen only when the current task needs durable context. Keep the retrieval summary short.`
  });

  assert.equal(spec.doc_type, 'knowledge-card');
  assert.equal(spec.summary, 'This card explains how retrieval memory should work in OpenClaw.');
  assert.deepEqual(spec.tags, ['memory', 'retrieval']);
  assert.deepEqual(spec.key_findings, [
    'Keep the memory layer small',
    'Prefer explicit retrieval triggers',
  ]);
  assert.deepEqual(spec.risks, ['Hidden automation is hard to debug']);
  assert.deepEqual(spec.references, [
    {
      title: 'Memory design',
      url: 'https://example.com/design',
    },
  ]);
  assert.equal(spec.sections[0].heading, 'Example workflow');
});
