/**
 * Lets take the sanitized HTML and convert it into wordpress blocks
 * @param {string} content - The content to convert into blocks
 */
export function createWordPressBlocks(content) {
  return (
    content
      // Remove WIX wrapping list items with paragraphs
      .replace(/<li>(.*?)<\/li>/gs, (match) => match.replace(/<\/?p>/g, ''))
      // Convert images into figure blocks
      .replace(
        /<img[^>]+>/g,
        '\n\n<!-- wp:image -->\n<figure class="wp-block-image size-full">$&</figure>\n<!-- /wp:image -->',
      )
      // Convert other block elements
      .replace(/<(ul|ol)>/g, '\n\n<!-- wp:list -->\n$&')
      .replace(/<\/(ul|ol)>/g, '$&\n<!-- /wp:list -->')
      .replace(/<li>/g, '\n\n<!-- wp:list-item -->\n<li>')
      .replace(/<\/li>/g, '</li>\n<!-- /wp:list-item -->')
      .replace(/<p>/g, '\n\n<!-- wp:paragraph -->\n<p>')
      .replace(/<\/p>/g, '</p>\n<!-- /wp:paragraph -->')
  );
}
