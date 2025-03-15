import path from 'node:path';
import fs from 'fs-extra';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CACHE_DIR } from '../env.js';
import { sanitizeContent } from '../utils/sanitizeContent.js';
import { appendAttachments } from '../utils/appendAttachments.js';
import { removeNBSP, md5 } from '../utils/stringUtils.js';
import { sleep } from '../utils/sleep.js';

/**
 * Extract post data from WIX html page
 * @param {string} data - The html page content
 * @param {Map} attachments - The attachments (images)
 * @param {object} config - The configuration
 */
export async function extractPost(url, attachments, config) {
  const hash = md5(url);
  // Cache the file system to keep from re-downloading the same file
  // and avoiding being blocked by the server
  const cachePost = path.join(CACHE_DIR, `${hash}.html`);
  let data = '';
  // Check if the file exists in the cache
  if (await fs.pathExists(cachePost)) {
    data = await fs.readFile(cachePost, 'utf-8');
  } else {
    // Sleep for a second to avoid being blocked by the server
    await sleep();
    data = (await axios.get(url)).data;
    await fs.writeFile(cachePost, data);
  }

  const $ = cheerio.load(data);
  const postThumbnailUrl = $('meta[property="og:image"]').attr('content');
  const postDescriptionText = $('meta[property="og:description"]').attr(
    'content',
  );
  const postTitleText = $('meta[property="og:title"]').attr('content');
  const postAuthorText = $('meta[property="article:author"]').attr('content');
  const postDateText = $('meta[property="article:published_time"]').attr(
    'content',
  );
  const postContent = $('[data-id="content-viewer"]').html();
  const postName = url.split('/').pop();
  const content = removeNBSP(sanitizeContent(postContent, attachments, config));
  return {
    hash,
    name: postName,
    title: removeNBSP(postTitleText),
    author: postAuthorText,
    date: postDateText,
    thumbnail: appendAttachments(postThumbnailUrl, attachments, config)?.id,
    content: content.trim(),
    description: removeNBSP(postDescriptionText),
    url,
  };
}
