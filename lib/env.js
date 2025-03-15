import path from 'node:path';

/** Path to the output directory */
export const OUTPUT_DIR = process.cwd();

/** Path to the cache directory */
export const CACHE_DIR = path.resolve(process.cwd(), '.cache');
