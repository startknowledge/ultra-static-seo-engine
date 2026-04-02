import { detectNewRepos } from './repo-detector.js';
import { runStrategy } from './strategy-engine.js';
import { generateContentForRepo } from './content-generator.js';
import { generateSEO } from './seo-generator.js';
import { generateCSS } from './css-generator.js';
import { runCleaner } from './cleaner.js';
import { CONFIG } from '../config.js';
import { delay } from './utils.js';
import fs from 'fs';

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
  const { all: repos, new: newRepos } = await detectNewRepos();
  if (!repos.length) { console.log('⚠️ No repos found'); return; }
  console.log(`📦 Found ${repos.length} repos. New: ${newRepos.length}`);

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    console.log(`\n--- Processing ${i+1}/${repos.length}: ${repo} ---`);
    const domain = CONFIG.DOMAIN_TEMPLATE(repo);
    try {
      const strategy = await runStrategy(repo);
      const { blogs, pages } = await generateContentForRepo(repo, domain, strategy);
      await generateSEO(repo, domain, blogs, pages);
      await generateCSS(repo);
      console.log(`✅ ${repo} | ${blogs.length} blogs, ${pages.length} pages`);
    } catch (err) { console.error(`❌ ${repo} failed:`, err.message); }
    if (i < repos.length - 1) await delay(5000);
  }

  await generateRootIndex(repos);
  await runCleaner(repos);
  console.log('🔥 SYSTEM COMPLETE');
}

if (import.meta.url === `file://${process.argv[1]}`) runUltraCore().catch(console.error);