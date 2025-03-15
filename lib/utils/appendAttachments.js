import path from 'node:path';

let attachmentId = 1;

/**
 * Append attachments to collection.
 * @param {string} img URL path to image
 * @param {Map} attachments Collection of attachments
 * @param {object} config Configuration object
 * @returns
 */
export function appendAttachments(img, attachments, config) {
  const url = img?.replace(/\.(avif|webp|jpe?g|png)\/.+/i, '.$1');
  if (url) {
    if (attachments.has(url)) {
      return attachments.get(url);
    }
    const filename = url
      .split('/')
      .pop()
      .replace(/[^\w.-]/g, '');
    const src = config.destination + '/wp-content/uploads/' + filename;
    const name = path.basename(filename, path.extname(filename));
    const attachment = {
      id: attachmentId++,
      name,
      src,
      url,
      filename,
    };
    attachments.set(url, attachment);
    return attachment;
  }
  return undefined;
}
