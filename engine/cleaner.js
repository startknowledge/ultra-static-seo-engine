import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

// Remove orphaned folders and old blog files
export async function runCleaner(activeRepos) {
  const docsRoot = './docs';
  if (!fs.existsSync(docsRoot)) return;

  const now = Date.now();
  const maxAge = CONFIG.BLOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const entries = fs.readdirSync(docsRoot, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(docsRoot, entry.name);
    if (entry.isDirectory()) {
      // If repo no longer exists, delete whole folder
      if (!activeRepos.includes(entry.name)) {
        console.log(`🧹 Deleting orphaned repo folder: ${entry.name}`);
        fs.rmSync(fullPath, { recursive: true, force: true });
        continue;
      }

      // Clean old blog files inside the repo folder
      const files = fs.readdirSync(fullPath);
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile() && file.endsWith('.html')) {
          // Static pages to keep (regardless of age)
          const staticPages = ['about', 'contact', 'privacy', 'faq', 'disclaimer', 'terms'];
          const isStatic = staticPages.some(page => file === `${page}.html`);
          if (isStatic && CONFIG.KEEP_STATIC_PAGES) continue;

          // Delete if older than retention days
          if (now - stats.mtimeMs > maxAge) {
            console.log(`🧹 Deleting old blog: ${filePath}`);
            fs.unlinkSync(filePath);
          }
        }
      }
    } else {
      // Remove stray files in root
      console.log(`🧹 Deleting stray file: ${entry.name}`);
      fs.unlinkSync(fullPath);
    }
  }
}