#!/usr/bin/env node
/**
 * Create a Notion page under a nested path below the authorized root page.
 * Usage: node create_note_in_path.js "Research/Strategy" "title" ["markdown content"] [--type note|research|meeting-notes|decision-log|weekly-report|knowledge-card|plan|report]
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
const { ensurePagePath } = require('./path_utils.js');

const pagePath = process.argv[2];
const title = process.argv[3];
const content = process.argv[4] || '';
let options = {};

try {
  options = parseDocumentOptions(process.argv.slice(5));
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

if (!pagePath || !title) {
  console.error('Usage: node create_note_in_path.js "page/path" "title" "content (optional)" [options]');
  process.exit(1);
}

(async () => {
  const api = new NotionAPI();
  const parentPage = await ensurePagePath(api, pagePath);
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
    parentPage.id,
    title,
    blocks,
    spec ? documentSpecToPageOptions(spec) : {}
  );

  console.log('OK');
  console.log('PAGE_ID:', page.id);
  console.log('URL:', page.url);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
