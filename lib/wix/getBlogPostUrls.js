import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import xml2js from 'xml2js';
import { CACHE_DIR } from '../env.js';

/** Get all the blog posts URLs from the sitemap Wix publishes */
export async function getBlogPostsUrls(config) {
  let data = '';
  await fs.ensureDir(CACHE_DIR);
  const cacheSitemap = path.join(CACHE_DIR, '_sitemap.xml');
  if (await fs.pathExists(cacheSitemap)) {
    data = await fs.readFile(cacheSitemap, 'utf-8');
  } else {
    const url = `${config.source}/_sitemap.xml`;
    data = (await axios.get(url)).data;
    await fs.writeFile(cacheSitemap, data, 'utf-8');
  }
  const raw = await xml2js.parseStringPromise(data);
  return raw.urlset.url.map((url) => url.loc[0]);
}
