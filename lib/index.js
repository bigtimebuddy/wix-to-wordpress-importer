#!/usr/bin/env node

import path from 'node:path';
import ProgressBar from 'progress';
import { saveWXR } from './wordpress/saveWXR.js';
import { ensureConfig } from './utils/ensureConfig.js';
import { fetchBatch } from './wix/fetchBatch.js';
import { getBlogPostsUrls } from './wix/getBlogPostUrls.js';
import { OUTPUT_DIR } from './env.js';

(async () => {
  /** Fetch the blog data from the Wix site */
  const config = await ensureConfig();
  const urls = await getBlogPostsUrls(config);
  const progress = new ProgressBar('Processing [:bar] :percent', {
    total: urls.length,
    width: 40,
  });
  for (let i = 0; i < urls.length; i += config.batchSize) {
    const result = await fetchBatch(
      config,
      urls.slice(i, i + config.batchSize),
      progress,
    );
    const outputFile = `wordpress-import-${(i / config.batchSize).toString().padStart(2, '0')}.xml`;
    await saveWXR(config, result, path.join(OUTPUT_DIR, outputFile));
  }
})();
