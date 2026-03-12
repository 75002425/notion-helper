function parseDocumentOptions(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}.`);
    }

    if (arg === '--type') {
      options.doc_type = value;
      index += 1;
      continue;
    }

    if (arg === '--summary') {
      options.summary = value;
      index += 1;
      continue;
    }

    if (arg === '--status') {
      options.status = value;
      index += 1;
      continue;
    }

    if (arg === '--owner') {
      options.owner = value;
      index += 1;
      continue;
    }

    if (arg === '--updated-at') {
      options.updated_at = value;
      index += 1;
      continue;
    }

    if (arg === '--tags') {
      options.tags = value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === '--icon') {
      options.icon = value;
      index += 1;
      continue;
    }

    if (arg === '--cover') {
      options.cover = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function hasDocumentOptions(options = {}) {
  return Object.values(options).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  });
}

module.exports = {
  parseDocumentOptions,
  hasDocumentOptions,
};
