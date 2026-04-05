const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const Parser = require('rss-parser');
const parser = new Parser();

// ========== CONFIGURATION ==========
const REPO_CONFIG = JSON.parse(fs.readFileSync('config/repo-config.json', 'utf8'));
const PROCESSED_FILE = 'config/processed-repos.json';
let processedRepos = fs.existsSync(PROCESSED_FILE) ? JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')) : {};

// List of static pages that should exist in repo root (not in /pages/)
const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 'documentation.html', 'changelog.html'];

// Special index.html that must never be deleted (for ultra-static-seo-engine)
const PROTECTED_INDEX = {
  'ultra-static-seo-engine': fs.readFileSync('docs/ultra-static-seo-engine/index.html', 'utf8') // you'll provide this file
};

// ========== HELPER FUNCTIONS ==========
async function getTrendingKeywords(seed) {
  // Use Google Trends RSS feed
  const url = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=US`;
  try {
    const feed = await parser.parseURL(url);
    const titles = feed.items.slice(0, 10).map(item => item.title);
    return titles;
  } catch (e) {
    console.warn('Trends RSS failed, using fallback:', e.message);
    return [`${seed} strategies`, `best ${seed} tools`, `how to ${seed}`, `${seed} for beginners`, `advanced ${seed}`];
  }
}

async function generateBlogContent(keyword, repoName) {
  // Use your AI API (Groq, Mistral, OpenRouter) – example with Groq
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return fallbackContent(keyword);
  
  const prompt = `Write a detailed, SEO-optimized blog post (2000+ words) about "${keyword}". 
Include: 
- An engaging title with keyword
- Introduction with recent stats
- 5 actionable strategies
- Real-world examples
- Common mistakes to avoid
- FAQ section with schema markup
- Conclusion with call-to-action
Use headings (H2, H3), bullet points, and bold text. Make it E-E-A-T compliant.`;
  
  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });
    
    let content = response.data.choices[0].message.content;
    // Ensure proper HTML structure
    content = content.replace(/\n/g, '<br>').replace(/#{1,6} (.*?)(<br>)/g, '<h2>$1</h2>');
    return content;
  } catch (err) {
    console.error(`AI failed for ${keyword}:`, err.message);
    return fallbackContent(keyword);
  }
}

function fallbackContent(keyword) {
  return `<p>This is a comprehensive guide about ${keyword}. We cover everything you need to know to master ${keyword} in 2026.</p>
<h2>Why ${keyword} matters</h2>
<p>With the rise of digital transformation, ${keyword} has become essential for businesses.</p>
<h2>Key strategies</h2>
<ul><li>Strategy 1: Understand your audience</li><li>Strategy 2: Leverage data-driven insights</li><li>Strategy 3: Optimize continuously</li></ul>
<h2>FAQ</h2>
<p><strong>What is ${keyword}?</strong> It's the process of...</p>`;
}

async function updateSitemap(repo, newUrl, lastmod = new Date().toISOString()) {
  const sitemapPath = `docs/${repo}/sitemap.xml`;
  let sitemap = '';
  if (fs.existsSync(sitemapPath)) {
    sitemap = fs.readFileSync(sitemapPath, 'utf8');
    // Simple append if URL not already present
    if (!sitemap.includes(newUrl)) {
      const urlEntry = `  <url>\n    <loc>${newUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
      sitemap = sitemap.replace('</urlset>', `${urlEntry}</urlset>`);
    }
  } else {
    sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://${repo}.startknowledge.in/</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n</urlset>`;
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

function ensureStaticPages(repo) {
  // Create essential pages in repo root if missing
  const repoRoot = `docs/${repo}`;
  STATIC_PAGES.forEach(page => {
    const pagePath = path.join(repoRoot, page);
    if (!fs.existsSync(pagePath)) {
      const title = page.replace('.html', '').charAt(0).toUpperCase() + page.replace('.html', '').slice(1);
      const content = `<!DOCTYPE html><html><head><title>${title} - ${repo}</title></head><body><h1>${title}</h1><p>This page is auto-generated. Update content as needed.</p></body></html>`;
      fs.writeFileSync(pagePath, content);
      console.log(`📄 Created missing page: ${pagePath}`);
    }
  });
}

// ========== MAIN PROCESSING ==========
async function processRepo(repo) {
  const force = process.argv.includes('--force');
  if (!force && processedRepos[repo]) {
    console.log(`⏭️ Skipping ${repo} – already processed on ${processedRepos[repo]}`);
    return;
  }

  console.log(`\n--- Processing ${repo} ---`);
  const repoDir = `docs/${repo}`;
  fs.ensureDirSync(repoDir);
  fs.ensureDirSync(`${repoDir}/blog`);
  fs.ensureDirSync(`${repoDir}/images`);

  // Ensure static pages exist (root, not in pages/)
  ensureStaticPages(repo);

  // Protect ultra-static-seo-engine index.html
  if (repo === 'ultra-static-seo-engine') {
    const indexPath = `${repoDir}/index.html`;
    if (!fs.existsSync(indexPath) || force) {
      fs.writeFileSync(indexPath, PROTECTED_INDEX[repo]);
      console.log(`🛡️ Restored protected index.html for ${repo}`);
    }
  }

  // Get trending keywords based on repo name
  const seed = repo.replace(/-/g, ' ');
  const trending = await getTrendingKeywords(seed);
  const targetBlogCount = REPO_CONFIG[repo] || REPO_CONFIG.default;
  const keywords = trending.slice(0, targetBlogCount);

  let blogsGenerated = 0;
  for (const kw of keywords) {
    const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blogPath = `${repoDir}/blog/${slug}.html`;
    if (fs.existsSync(blogPath) && !force) {
      console.log(`⏩ Blog already exists: ${slug}`);
      continue;
    }
    console.log(`📝 Generating blog for keyword: ${kw}`);
    const content = await generateBlogContent(kw, repo);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${kw} | ${repo}</title>
  <meta name="description" content="Complete guide to ${kw}. Learn strategies, tools, and best practices.">
  <link rel="canonical" href="https://${repo}.startknowledge.in/blog/${slug}.html">
</head>
<body>
  <article>
    <h1>${kw}</h1>
    ${content}
  </article>
  <footer><p>© ${new Date().getFullYear()} ${repo}</p></footer>
</body>
</html>`;
    fs.writeFileSync(blogPath, html);
    console.log(`✅ Blog: https://${repo}.startknowledge.in/blog/${slug}.html`);
    
    // Update sitemap
    await updateSitemap(repo, `https://${repo}.startknowledge.in/blog/${slug}.html`);
    blogsGenerated++;
  }

  console.log(`✅ Completed ${repo} | ${blogsGenerated} blogs generated/updated`);

  // Mark as processed
  processedRepos[repo] = new Date().toISOString();
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedRepos, null, 2));
}

// ========== MAIN ==========
async function main() {
  // Get all repos from GitHub (or use a static list)
  const repos = ['bn-ration-scale', 'Calculator-Library-Portal', 'startknowledge', 'pension-calculator', 'ultra-static-seo-engine'];
  
  for (const repo of repos) {
    await processRepo(repo);
  }
  
  console.log('🔥 SYSTEM COMPLETE');
}

main().catch(console.error);