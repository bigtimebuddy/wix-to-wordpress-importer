import xmlbuilder from 'xmlbuilder';
import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * Output the file to the WordPress eXendeded RSS
 * @see https://ipggi.wordpress.com/2011/03/16/the-wordpress-extended-rss-wxr-exportimport-xml-document-format-decoded-and-explained/
 */
export async function saveWXR(config, { posts, attachments }, outputFile) {
  // Create the XML structure
  const rss = xmlbuilder
    .create('rss', { version: '1.0', encoding: 'UTF-8' })
    .att('version', '2.0')
    .att('xmlns:excerpt', 'http://wordpress.org/export/1.2/excerpt/')
    .att('xmlns:content', 'http://purl.org/rss/1.0/modules/content/')
    .att('xmlns:wfw', 'http://wellformedweb.org/CommentAPI/')
    .att('xmlns:dc', 'http://purl.org/dc/elements/1.1/')
    .att('xmlns:wp', 'http://wordpress.org/export/1.2/');

  const channel = rss.ele('channel');
  channel.ele('title', {}, '');
  channel.ele('link', {}, config.destination);
  channel.ele('description', {}, '');
  channel.ele('wp:wxr_version', {}, '1.2');
  channel.ele('wp:base_site_url', {}, config.destination);
  channel.ele('wp:base_blog_url', {}, config.destination);

  attachments.forEach((attachment) => {
    const item = channel.ele('item');
    item.ele('title', {}, attachment.filename);
    item.ele('link', {}, attachment.url);
    item.ele('pubDate', {}, new Date().toUTCString());
    item.ele('dc:creator', {}, 'admin');
    item.ele('guid', {}, attachment.url);
    item.ele('description', {}, attachment.filename);
    item.ele('content:encoded', {}, ``);
    item.ele('excerpt:encoded', {}, attachment.filename);
    item.ele('wp:post_id', {}, attachment.id);
    item.ele('wp:post_date', {}, new Date().toISOString());
    item.ele('wp:post_date_gmt', {}, new Date().toISOString());
    item.ele('wp:comment_status', {}, 'closed');
    item.ele('wp:ping_status', {}, 'closed');
    item.ele('wp:post_name', {}, attachment.name);
    item.ele('wp:status', {}, 'inherit');
    item.ele('wp:post_parent', {}, '0');
    item.ele('wp:menu_order', {}, '0');
    item.ele('wp:post_type', {}, 'attachment');
    item.ele('wp:attachment_url', {}, attachment.url);
  });

  // Add posts to the XML
  posts
    .filter((post) => {
      const valid = post.date && post.title && post.content;
      if (!valid) {
        console.error(chalk.yellow('ERROR: Invalid post ', post));
      }
      return valid;
    })
    .forEach((post) => {
      const item = channel.ele('item');
      item.ele('title', {}, post.title);
      item.ele('link', {}, post.url);
      item.ele('pubDate', {}, new Date(post.date).toUTCString());
      item.ele('dc:creator', {}, post.author);
      item.ele('description', {}, post.description);
      item.ele('content:encoded', {}, post.content);
      item.ele('excerpt:encoded', {}, post.description);
      item.ele('wp:post_id', {}, '0');
      item.ele('wp:post_date', {}, post.date);
      item.ele('wp:post_date_gmt', {}, new Date(post.date).toISOString());
      item.ele('wp:comment_status', {}, 'open');
      item.ele('wp:ping_status', {}, 'open');
      item.ele('wp:post_name', {}, post.name);
      item.ele('wp:status', {}, 'publish');
      item.ele('wp:post_parent', {}, '0');
      item.ele('wp:menu_order', {}, '0');
      item.ele('wp:post_type', {}, 'post');
      item.ele('wp:post_password', {}, '');
      item.ele('wp:is_sticky', {}, '0');

      // Add post thumbnail as a custom field
      if (post.thumbnail) {
        const postmeta = item.ele('wp:postmeta');
        postmeta.ele('wp:meta_key', {}, '_thumbnail_id');
        postmeta.ele('wp:meta_value', {}, post.thumbnail);
      }
    });

  // Convert the XML object to a string
  const xmlString = rss.end({ pretty: true });

  // Write the XML string to a file
  return fs.writeFile(outputFile, xmlString);
}
