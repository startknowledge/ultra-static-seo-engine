import { getRepos, detectNewRepos } from './repo-detector.js';
import { runStrategy } from './strategy-engine.js';
import { generateContentForRepo } from './content-generator.js';
import { generateSEO } from './seo-generator.js';
import { generateCSS } from './css-generator.js';
import { runCleaner } from './cleaner.js';
import { CONFIG } from '../config.js';
import { delay } from './utils.js';  // <-- import delay

export async function runUltraCore() {
  console.log('🚀 GOD-LEVEL AUTONOMOUS SEO ENGINE STARTED');

  // 1. Get all repos (and detect new ones)
  const { all: repos, new: newRepos } = await detectNewRepos();
  if (repos.length === 0) {
    console.log('⚠️ No repositories found. Exiting.');
    return;
  }
  console.log(`📦 Found ${repos.length} repos. New: ${newRepos.length}`);

  // 2. Process each repo with a delay between them
  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    console.log(`\n--- Processing repo (${i+1}/${repos.length}): ${repo} ---`);
    const domain = CONFIG.DOMAIN_TEMPLATE(repo);

    try {
      // Generate keywords strategy
      const strategy = await runStrategy(repo);

      // Generate all content (blogs + pages)
      const { blogs, pages } = await generateContentForRepo(repo, domain, strategy);

      // Generate SEO files (sitemap, robots, etc.)
      await generateSEO(repo, domain, blogs, pages);

      // Generate dynamic CSS
      await generateCSS(repo);

      console.log(`✅ Completed ${repo} | ${blogs.length} blogs, ${pages.length} pages`);
    } catch (err) {
      console.error(`❌ Failed to process ${repo}:`, err.message);
    }

    // Wait 5 seconds before processing next repo to avoid rate limits
    if (i < repos.length - 1) {
      console.log(`⏳ Waiting 5 seconds before next repo...`);
      await delay(5000);
    }
  }

  // 3. Clean up orphaned folders/files
  await runCleaner(repos);

  console.log('🔥 SYSTEM COMPLETE');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUltraCore().catch(console.error);
}