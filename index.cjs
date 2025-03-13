const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const axios = require("axios");
const xml2js = require("xml2js");
const cheerio = require("cheerio");
const xmlbuilder = require("xmlbuilder");
const sanitizeHtml = require("sanitize-html");

const WIX_SITE_URL = "https://bigtimebuddy.wixstudio.com/fszs-blog";
const UPLOAD_URL = "https://fszs.org/wp-content/uploads/";

function sleep(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Used for caching file */
function md5(input) {
  const hash = crypto.createHash("md5");
  hash.update(input);
  return hash.digest("hex");
}

/** Get all the blog posts URLs from the sitemap Wix publishes */
async function getBlogPostsUrls() {
  let data = "";
  const cacheSitemap = path.resolve(__dirname, ".cache/blog-posts-sitemap.xml");
  if (fs.existsSync(cacheSitemap)) {
    data = await fs.promises.readFile(cacheSitemap, "utf-8");
  } else {
    const url = `${WIX_SITE_URL}/blog-posts-sitemap.xml`;
    data = (await axios.get(url)).data;
    await fs.promises.writeFile(cacheSitemap, data, "utf-8");
  }
  const raw = await xml2js.parseStringPromise(data);
  const blogUrls = raw.urlset.url.map((url) => url.loc[0]);
  console.log(blogUrls.length, "posts");
  return blogUrls;
}

/** Fetch the blog data from the Wix site */
async function fetchBlogData() {
  const blogUrls = await getBlogPostsUrls();
  const posts = [];
  const attachments = new Map();
  const total = blogUrls.length;
  let current = 0;
  for (const url of blogUrls) {
    try {
      current++;
      process.stdout.write(
        `Processing URL ${url.replace(WIX_SITE_URL, "")} ... `,
      );
      // Cache the file system to keep from re-downloading the same file
      // and avoiding being blocked by the server
      const cachePost = path.resolve(__dirname, `.cache/${md5(url)}.html`);
      let data = "";
      // Check if the file exists in the cache
      if (fs.existsSync(cachePost)) {
        data = await fs.promises.readFile(cachePost, "utf-8");
      } else {
        // Sleep for a second to avoid being blocked by the server
        await sleep();
        data = (await axios.get(url)).data;
        await fs.promises.writeFile(cachePost, data);
      }
      const $ = cheerio.load(data);
      const postThumbnailUrl = $('meta[property="og:image"]').attr("content");
      const postDescriptionText = $('meta[property="og:description"]').attr(
        "content",
      );
      const postTitleText = $('meta[property="og:title"]').attr("content");
      const postAuthorText = $('meta[property="article:author"]').attr(
        "content",
      );
      const postDateText = $('meta[property="article:published_time"]').attr(
        "content",
      );
      const postContent = $('[data-id="content-viewer"]').html();
      const postName = URL.split("/").pop();
      posts.push({
        name: postName,
        title: removeNBSP(postTitleText),
        author: postAuthorText,
        date: postDateText,
        thumbnail: cleanSrc(postThumbnailUrl, attachments)?.id,
        content: removeNBSP(cleanHTML(postContent, attachments)),
        description: removeNBSP(postDescriptionText),
        url,
      });
      process.stdout.write(`done! (${Math.round((current / total) * 100)}%)\n`);
    } catch (error) {
      console.error(
        `Error processing URL ${url}: ${error.message}!`,
        error.stack,
      );
    }
  }
  return { posts, attachments };
}

let attachmentId = 1;

function cleanSrc(img, attachments) {
  const url = img?.replace(/\.(avif|webp|jpeg|png)\/.+/, ".$1");
  if (url) {
    if (attachments.has(url)) {
      return attachments.get(url);
    }
    const filename = url
      .split("/")
      .pop()
      .replace(/[^\w.-]/g, "");
    const src = UPLOAD_URL + filename;
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

/** Remove nobreaking space characters */
function removeNBSP(content) {
  return content.replace(/\u00A0/g, " ");
}

/** Sanitize the HTML from WIX, remove attributes and unnecessary tags */
function cleanHTML(content, attachments) {
  return sanitizeHtml(content, {
    allowedTags: [
      "p",
      "a",
      "img",
      "strong",
      "b",
      "u",
      "i",
      "em",
      "ul",
      "ol",
      "li",
    ],
    allowedAttributes: {
      img: ["src", "alt"],
      a: ["href"],
    },
    disallowedTagsMode: "discard",
    transformTags: {
      img: (tagName, attribs) => {
        return {
          tagName,
          attribs: {
            src: cleanSrc(attribs.src, attachments)?.src,
            decoding: "async",
            fetchpriority: "high",
          },
        };
      },
    },
  });
}

/**
 * Output the file to the WordPress eXendeded RSS
 * @see https://ipggi.wordpress.com/2011/03/16/the-wordpress-extended-rss-wxr-exportimport-xml-document-format-decoded-and-explained/
 */
async function saveToFile(posts, attachments) {
  // Create the XML structure
  const rss = xmlbuilder
    .create("rss", { version: "1.0", encoding: "UTF-8" })
    .att("version", "2.0")
    .att("xmlns:excerpt", "http://wordpress.org/export/1.2/excerpt/")
    .att("xmlns:content", "http://purl.org/rss/1.0/modules/content/")
    .att("xmlns:wfw", "http://wellformedweb.org/CommentAPI/")
    .att("xmlns:dc", "http://purl.org/dc/elements/1.1/")
    .att("xmlns:wp", "http://wordpress.org/export/1.2/");

  const channel = rss.ele("channel");
  channel.ele("title", {}, "FSZS");
  channel.ele("link", {}, "https://fszs.org");
  channel.ele("description", {}, "Teachings from original FSZS site");
  channel.ele("wp:wxr_version", {}, "1.2");
  channel.ele("wp:base_site_url", {}, "https://fszs.org");
  channel.ele("wp:base_blog_url", {}, "https://fszs.org");

  attachments.forEach((attachment) => {
    const item = channel.ele("item");
    item.ele("title", {}, attachment.filename);
    item.ele("link", {}, attachment.url);
    item.ele("pubDate", {}, new Date().toUTCString());
    item.ele("dc:creator", {}, "admin");
    item.ele("guid", {}, attachment.url);
    item.ele("description", {}, attachment.filename);
    item.ele("content:encoded", {}, ``);
    item.ele("excerpt:encoded", {}, attachment.filename);
    item.ele("wp:post_id", {}, attachment.id);
    item.ele("wp:post_date", {}, new Date().toISOString());
    item.ele("wp:post_date_gmt", {}, new Date().toISOString());
    item.ele("wp:comment_status", {}, "closed");
    item.ele("wp:ping_status", {}, "closed");
    item.ele("wp:post_name", {}, attachment.name);
    item.ele("wp:status", {}, "inherit");
    item.ele("wp:post_parent", {}, "0");
    item.ele("wp:menu_order", {}, "0");
    item.ele("wp:post_type", {}, "attachment");
    item.ele("wp:attachment_url", {}, attachment.url);
  });

  // Add posts to the XML
  posts.forEach((post) => {
    const item = channel.ele("item");
    item.ele("title", {}, post.title);
    item.ele("link", {}, post.url);
    item.ele("pubDate", {}, new Date(post.date).toUTCString());
    item.ele("dc:creator", {}, post.author);
    item.ele("description", {}, post.description);
    item.ele("content:encoded", {}, post.content);
    item.ele("excerpt:encoded", {}, post.description);
    item.ele("wp:post_id", {}, "0");
    item.ele("wp:post_date", {}, post.post_date);
    item.ele("wp:post_date_gmt", {}, new Date(post.date).toISOString());
    item.ele("wp:comment_status", {}, "open");
    item.ele("wp:ping_status", {}, "open");
    item.ele("wp:post_name", {}, post.name);
    item.ele("wp:status", {}, "publish");
    item.ele("wp:post_parent", {}, "0");
    item.ele("wp:menu_order", {}, "0");
    item.ele("wp:post_type", {}, "post");
    item.ele("wp:post_password", {}, "");
    item.ele("wp:is_sticky", {}, "0");

    // Add post thumbnail as a custom field
    if (post.thumbnail) {
      const postmeta = item.ele("wp:postmeta");
      postmeta.ele("wp:meta_key", {}, "_thumbnail_id");
      postmeta.ele("wp:meta_value", {}, post.thumbnail);
    }
  });

  // Convert the XML object to a string
  const xmlString = rss.end({ pretty: true });

  // Write the XML string to a file
  return fs.promises.writeFile("wordpress-import.xml", xmlString);
}

(async () => {
  const { posts, attachments } = await fetchBlogData();
  if (posts.length > 0) {
    await saveToFile(posts, attachments);
  }
})();
