import { getRepos, detectNewRepos } from './repo-detector.js';
import { runStrategy } from './strategy-engine.js';
import { generateContentForRepo } from './content-generator.js';
import { generateSEO } from './seo-generator.js';
import { generateCSS } from './css-generator.js';
import { runCleaner } from './cleaner.js';
import { CONFIG } from '../config.js';

export async function runUltraCore() {
  console.log('🚀 GOD-LEVEL AUTONOMOUS SEO ENGINE STARTED');

  // 1. Get all repos (and detect new ones)
  const { all: repos, new: newRepos } = await detectNewRepos();
  if (repos.length === 0) {
    console.log('⚠️ No repositories found. Exiting.');
    return;
  }
  console.log(`📦 Found ${repos.length} repos. New: ${newRepos.length}`);

  // 2. Process each repo
  for (const repo of repos) {
    console.log(`\n--- Processing repo: ${repo} ---`);
    const domain = CONFIG.DOMAIN_TEMPLATE(repo);

    // Generate keywords strategy
    const strategy = await runStrategy(repo);

    // Generate all content (blogs + pages)
    const { blogs, pages } = await generateContentForRepo(repo, domain, strategy);

    // Generate SEO files (sitemap, robots, etc.)
    await generateSEO(repo, domain, blogs, pages);

    // Generate dynamic CSS
    await generateCSS(repo);

    console.log(`✅ Completed ${repo} | ${blogs.length} blogs, ${pages.length} pages`);
  }

  // 3. Clean up orphaned folders/files
  await runCleaner(repos);

  console.log('🔥 SYSTEM COMPLETE');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUltraCore().catch(console.error);
}