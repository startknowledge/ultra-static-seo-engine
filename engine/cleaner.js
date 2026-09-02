import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

// Remove orphaned repositories and old blog posts only.
export async function runCleaner(activeRepos = []) {
  const docsRoot = './docs';

  if (!fs.existsSync(docsRoot)) {
    return;
  }

  const now = Date.now();

  const retentionDays = Number(
    CONFIG?.BLOG_RETENTION_DAYS ?? 90
  );

  const maxAge =
    retentionDays *
    24 *
    60 *
    60 *
    1000;

  const entries = fs.readdirSync(
    docsRoot,
    { withFileTypes: true }
  );

  for (const entry of entries) {
    const fullPath = path.join(
      docsRoot,
      entry.name
    );

    /*
     * Only repository directories are processed.
     */
    if (!entry.isDirectory()) {
      continue;
    }

    /*
     * Remove repository folders that are no longer
     * part of the active repository list.
     */
    if (!activeRepos.includes(entry.name)) {
      console.log(
        `🧹 Deleting orphaned repo folder: ${entry.name}`
      );

      fs.rmSync(
        fullPath,
        {
          recursive: true,
          force: true
        }
      );

      continue;
    }

    /*
     * IMPORTANT:
     *
     * Cleaner only works inside:
     *
     * docs/<repo>/blog/
     *
     * It does NOT scan the repository root.
     *
     * Therefore files such as:
     *
     * about.html
     * contact.html
     * privacy.html
     * faq.html
     * terms.html
     *
     * are completely outside the cleaner logic.
     */
    const blogDir = path.join(
      fullPath,
      'blog'
    );

    if (!fs.existsSync(blogDir)) {
      continue;
    }

    const blogEntries = fs.readdirSync(
      blogDir,
      { withFileTypes: true }
    );

    for (const blogEntry of blogEntries) {

      /*
       * Do not touch directories.
       *
       * This preserves:
       * blog/images/
       * and other blog subdirectories.
       */
      if (!blogEntry.isFile()) {
        continue;
      }

      const fileName =
        blogEntry.name;

      /*
       * Only HTML files inside blog/ are
       * considered old blog posts.
       */
      if (
        !fileName
          .toLowerCase()
          .endsWith('.html')
      ) {
        continue;
      }

      const filePath = path.join(
        blogDir,
        fileName
      );

      let stats;

      try {
        stats = fs.statSync(
          filePath
        );
      } catch {
        continue;
      }

      /*
       * Delete only posts older than the
       * configured retention period.
       */
      if (
        now - stats.mtimeMs >
        maxAge
      ) {
        console.log(
          `🧹 Deleting old blog: ${filePath}`
        );

        try {
          fs.unlinkSync(
            filePath
          );
        } catch (error) {
          console.warn(
            `⚠️ Failed to delete ${filePath}: ${error.message}`
          );
        }
      }
    }
  }

  console.log(
    '✅ Cleaner completed.'
  );
}