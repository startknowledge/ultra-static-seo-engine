import { detectNewRepos } from './repo-detector.js';
import { runStrategy } from './strategy-engine.js';
import { generateContentForRepo } from './content-generator.js';
import { generateSEO } from './seo-generator.js';
import { generateCSS } from './css-generator.js';
import { runCleaner } from './cleaner.js';
import { CONFIG } from '../config.js';
import { delay, sanitizeSlug } from './utils.js';
import fs from 'fs';

// Import new engines
import { getCombinedTrends } from './trend-engine.js';
import { generateMoneyPagesForRepo } from './money-engine.js';
import { generateLocationPages } from './programmatic-engine.js';
import { buildTopicClusters, crossLinkRepos } from './authority-engine.js';
import { autoBacklink } from './backlink-engine.js';
import { refreshOldBlogs } from './content-rewriter.js';

// Helper functions for home page
function buildNav(repoName) {
  return `<nav>
    <a href="/${repoName}/">Home</a>
    <a href="/${repoName}/blog/">Blog</a>
    <a href="/${repoName}/pages/about.html">About</a>
    <a href="/${repoName}/pages/contact.html">Contact</a>
    <a href="/${repoName}/pages/privacy.html">Privacy</a>
    <a href="/${repoName}/pages/faq.html">FAQ</a>
    <a href="/${repoName}/pages/disclaimer.html">Disclaimer</a>
    <a href="/${repoName}/pages/terms.html">Terms</a>
  </nav>`;
}

function buildFooter(repoName) {
  return `<footer><p>&copy; ${new Date().getFullYear()} ${repoName} | <a href="/${repoName}/pages/privacy.html">Privacy</a> | <a href="/${repoName}/pages/faq.html">FAQ</a> | <a href="/${repoName}/pages/disclaimer.html">Disclaimer</a> | <a href="/${repoName}/pages/terms.html">Terms</a></p></footer>`;
}

async function generateRootIndex(repos) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StartKnowledge – SEO Automation Hub</title><style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:1rem;} ul{list-style:none;padding:0;} li{margin:0.5rem 0;} a{color:#667eea;text-decoration:none;} a:hover{text-decoration:underline;}</style></head>
<body><h1>🚀 StartKnowledge SEO Engine</h1><p>Automatically generated sites for all repositories:</p><ul>${repos.map(r => `<li><a href="/${r}/">${r}</a></li>`).join('')}</ul><footer><p>Updated automatically every 7 hours.</p></footer></body>
</html>`;
  fs.writeFileSync('./docs/index.html', html);
}

async function generateHomePage(repoName, domain, strategy, blogs) {
  const nav = buildNav(repoName);
  const footer = buildFooter(repoName);
  const homeHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${repoName} – Expert Insights & Tools</title><meta name="description" content="Welcome to ${repoName}. Discover the latest articles, guides, and tools."><link rel="stylesheet" href="/${repoName}/style.css"></head>
<body><header>${nav}</header><div class="container"><h1>Welcome to ${repoName}</h1><p>Your trusted source for ${strategy.niche}.</p><div class="blog-grid">${blogs.slice(0, 6).map(b => `
  <div class="blog-card">
    <img src="/${repoName}/blog/images/${sanitizeSlug(b.keyword)}.jpg" alt="${b.keyword}" onerror="this.src='https://placehold.co/600x400?text=Blog+Image'">
    <div class="blog-card-content">
      <h3>${b.keyword}</h3>
      <p>Read our latest insights about ${b.keyword}.</p>
      <a href="${b.url}" class="read-more">Read more →</a>
    </div>
  </div>`).join('')}</div><div style="text-align:center; margin:2rem;"><a href="/${repoName}/blog/" class="read-more">View All Posts →</a></div></div>${footer}</body>
</html>`;
  fs.writeFileSync(`./docs/${repoName}/index.html`, homeHtml);
  console.log(`🏠 Generated home page for ${repoName}`);
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

  // Fetch trends once for inspiration (not used for keyword generation)
  let trends = [];
  try {
    trends = await getCombinedTrends();
    console.log("Trends for content ideas:", trends.slice(0,5));
  } catch (err) {
    console.warn("Trend fetch failed:", err.message);
  }

  // Process each repo sequentially (respects API rate limits)
  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    console.log(`\n--- Processing ${i+1}/${repos.length}: ${repo} ---`);
    const domain = CONFIG.DOMAIN_MAP?.[repo] || CONFIG.DOMAIN_TEMPLATE(repo);

    try {
      // 1. Keyword strategy (uses Google Trends + AI)
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

      // 10. Generate home page for this repo (after all content)
      await generateHomePage(repo, domain, strategy, blogs);

      console.log(`✅ Completed ${repo} | ${blogs.length} blogs, ${pages.length} pages, ${moneyPages.length} money pages`);

    } catch (err) {
      console.error(`❌ Failed to process ${repo}:`, err.message);
    }

    // Delay between repos to respect API rate limits
    if (i < repos.length - 1) await delay(5000);
  }

  // Cross-link all repos (authority network)
  try {
    await crossLinkRepos(repos);
  } catch (err) {
    console.warn(`Cross-linking failed: ${err.message}`);
  }

  // Generate root index page (hub for all repos)
  await generateRootIndex(repos);

  // Clean up orphaned folders
  await runCleaner(repos);

  console.log('🔥 SYSTEM COMPLETE');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUltraCore().catch(console.error);
}