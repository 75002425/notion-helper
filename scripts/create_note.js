#!/usr/bin/env node
/**
 * Create a Notion page under the authorized root page.
 * Usage: node create_note.js "title" ["markdown content"] [--type note|research|meeting-notes|decision-log|weekly-report|knowledge-card|plan|report]
 */
const NotionAPI = require('./notion_api.js');
const { parseDocumentOptions } = require('./document_cli.js');
const {
  buildDocumentSpecFromMarkdown,
  shouldUseDesignedDocument,
} = require('./document_designer.js');
const { textToBlocks } = require('./formatter.js');
const {
  documentSpecToBlocks,
  documentSpecToPageOptions,
} = require('./document_renderer.js');

const title = process.argv[2];
const content = process.argv[3] || '';
let options = {};

try {
  options = parseDocumentOptions(process.argv.slice(4));
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

if (!title) {
  console.error('Usage: node create_note.js "title" "content (optional)" [options]');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const rootPage = await api.findRootPage();
  const useDesignedDocument = shouldUseDesignedDocument(content, options);
  const spec = useDesignedDocument
    ? buildDocumentSpecFromMarkdown({
      title,
      markdown: content,
      ...options,
    })
    : null;
  const blocks = useDesignedDocument
    ? documentSpecToBlocks(spec)
    : (content ? textToBlocks(content) : []);
  const page = await api.createPageSafe(
    rootPage.id,
    title,
    blocks,
    spec ? documentSpecToPageOptions(spec) : {}
  );

  console.log('OK');
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
