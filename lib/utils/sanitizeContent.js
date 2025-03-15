import sanitizeHtml from 'sanitize-html';
import { createWordPressBlocks } from './createWordPressBlocks.js';
import { appendAttachments } from './appendAttachments.js';

/**
 * Sanitize the HTML from WIX, remove attributes and unnecessary tags
 * @param {string} content - The content to sanitize
 * @param {Map} attachments - The attachments object
 */
export function sanitizeContent(content, attachments, config) {
  return createWordPressBlocks(
    sanitizeHtml(content, {
      allowedTags: [
        'p',
        'a',
        'img',
        'strong',
        'b',
        'u',
        'i',
        'em',
        'ul',
        'ol',
        'li',
      ],
      allowedAttributes: {
        img: ['src', 'alt', 'height', 'width'],
        a: ['href'],
      },
      disallowedTagsMode: 'discard',
      exclusiveFilter: (frame) => {
        return frame.tag === 'p' && !frame.text.trim();
      },
      transformTags: {
        ol: () => {
          return {
            tagName: 'ul',
            attribs: {
              class: 'wp-block-list',
            },
          };
        },
        img: (tagName, attribs) => {
          const src = appendAttachments(attribs.src, attachments, config)?.src;
          return {
            tagName,
            attribs: {
              ...attribs,
              src,
              decoding: 'async',
              fetchpriority: 'high',
            },
          };
        },
        ul: (tagName) => {
          return {
            tagName,
            attribs: {
              class: 'wp-block-list',
            },
          };
        },
      },
    }),
  );
}
