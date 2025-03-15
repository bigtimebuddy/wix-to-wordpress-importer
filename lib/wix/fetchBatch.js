import chalk from 'chalk';
import { extractPost } from './extractPost.js';

/**
 * Fetch a batch of urls
 * @param {Object} config The configuration object
 * @param {string[]} urls The URLs to fetch
 * @param {ProgressBar} progress The progress bar
 * @returns {Promise<{ posts: Object[], attachments: Map<string, Object> }>} The fetched posts and attachments
 */
export async function fetchBatch(config, urls, progress) {
  const posts = [];
  const attachments = new Map();
  for (const url of urls) {
    progress.tick();
    try {
      const post = await extractPost(url, attachments, config);
      if (!post.content) {
        continue;
      }
      posts.push(post);
    } catch (error) {
      console.error(
        chalk.red(`ERROR: Unable to process URL ${url}: ${error.message}!`),
        chalk.gray(error.stack),
      );
    }
  }
  return { posts, attachments };
}
