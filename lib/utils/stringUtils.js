import crypto from 'node:crypto';

/** Used for caching file */
export function md5(input) {
  const hash = crypto.createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}

/**
 * Remove nobreaking space characters
 * @param {string} content
 */
export function removeNBSP(content) {
  return content?.replace(/\u00A0/g, ' ') ?? '';
}

/**
 * If the input is an absolute URL.
 * @param {string} url
 * @returns
 */
export function isURL(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}
