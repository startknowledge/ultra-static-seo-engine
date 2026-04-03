import { detectNewRepos } from './repo-detector.js';
import { runStrategy } from './strategy-engine.js';
import { generateContentForRepo } from './content-generator.js';
import { generateSEO } from './seo-generator.js';
import { generateCSS } from './css-generator.js';
import { runCleaner } from './cleaner.js';
import { CONFIG } from '../config.js';
import { delay } from './utils.js';
import fs from 'fs';

// Import new engines
import { getCombinedTrends } from './trend-engine.js';
import { generateMoneyPagesForRepo } from './money-engine.js';
import { generateLocationPages } from './programmatic-engine.js';
import { buildTopicClusters, crossLinkRepos } from './authority-engine.js';
import { autoBacklink } from './backlink-engine.js';
import { refreshOldBlogs } from './content-rewriter.js';

async function generateRootIndex(repos) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StartKnowledge – SEO Automation Hub</title><style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:1rem;} ul{list-style:none;padding:0;} li{margin:0.5rem 0;} a{color:#667eea;text-decoration:none;} a:hover{text-decoration:underline;}</style></head>
<body><h1>🚀 StartKnowledge SEO Engine</h1><p>Automatically generated sites for all repositories:</p><ul>${repos.map(r => `<li><a href="/${r}/">${r}</a></li>`).join('')}</ul><footer><p>Updated automatically every 7 hours.</p></footer></body>
</html>`;
  fs.writeFileSync('./docs/index.html', html);
}

export async function runUltraCore() {
  console.log('🚀 GOD-LEVEL SYSTEM STARTED');

  // Get all repos
  const { all: repos, new: newRepos } = await detectNewRepos();
  if (!repos.length) {
    console.log('⚠️ No repos found');
    return;
  }
  console.log(`📦 Found ${repos.length} repos. New: ${newRepos.length}`);

  // Fetch trends once (for inspiration, not critical)
  let trends = [];
  try {
    trends = await getCombinedTrends();
    console.log("Trends for content ideas:", trends.slice(0,5));
  } catch (err) {
    console.warn("Trend fetch failed:", err.message);
  }

  // Process each repo
  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    console.log(`\n--- Processing ${i+1}/${repos.length}: ${repo} ---`);
    const domain = CONFIG.DOMAIN_MAP[repo] || CONFIG.DOMAIN_TEMPLATE(repo);

    try {
      // 1. Keyword strategy
      const strategy = await runStrategy(repo);

      // 2. Regular content (blogs + pages)
      const { blogs, pages } = await generateContentForRepo(repo, domain, strategy);

      // 3. SEO files
      await generateSEO(repo, domain, blogs, pages);

      // 4. Dynamic CSS
      await generateCSS(repo);

      // 5. Money pages (buyer intent + affiliate)
      let moneyPages = [];
      try {
        moneyPages = await generateMoneyPagesForRepo(repo, domain, strategy.cluster);
        console.log(`💰 Generated ${moneyPages.length} money pages`);
      } catch (err) {
        console.warn(`Money pages failed: ${err.message}`);
      }

      // 6. Programmatic pages (location pages, etc.)
      let progPages = [];
      try {
        const locations = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
        progPages = await generateLocationPages(repo, domain, strategy.niche, locations);
        console.log(`📍 Generated ${progPages.length} programmatic pages`);
      } catch (err) {
        console.warn(`Programmatic pages failed: ${err.message}`);
      }

      // 7. Authority signals (topic clusters)
      try {
        await buildTopicClusters(repo, blogs);
      } catch (err) {
        console.warn(`Topic clusters failed: ${err.message}`);
      }

      // 8. Auto backlink (first blog only)
      if (blogs.length) {
        try {
          await autoBacklink(blogs[0].keyword, blogs[0].url, blogs[0].url);
        } catch (err) {
          console.warn(`Auto backlink failed: ${err.message}`);
        }
      }

      // 9. Refresh old blogs (older than 60 days)
      try {
        await refreshOldBlogs(repo, 60);
      } catch (err) {
        console.warn(`Blog refresh failed: ${err.message}`);
      }

      console.log(`✅ Completed ${repo} | ${blogs.length} blogs, ${pages.length} pages, ${moneyPages.length} money pages`);

    } catch (err) {
      console.error(`❌ Failed to process ${repo}:`, err.message);
    }

    // Delay between repos
    if (i < repos.length - 1) await delay(5000);
  }

  // Cross-link all repos (authority network)
  try {
    await crossLinkRepos(repos);
  } catch (err) {
    console.warn(`Cross-linking failed: ${err.message}`);
  }

  // Generate root index page
  await generateRootIndex(repos);

  // Clean up orphaned folders
  await runCleaner(repos);

  console.log('🔥 SYSTEM COMPLETE');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUltraCore().catch(console.error);
}