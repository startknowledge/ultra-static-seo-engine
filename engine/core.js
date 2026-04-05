// engine/core.js - Multi-repo blog generator with direct commit to each repo
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();
const simpleGit = require('simple-git');

// ========== CONFIG ==========
const GITHUB_TOKEN = process.env.ALL_REPO || process.env.MY_GITHUB_TOKEN;
const GITHUB_USER = 'startknowledge';
const TEMP_DIR = path.join(__dirname, '..', 'temp_repos');

// All repositories to process
const REPOS = [
  { name: 'bn-ration-scale', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/bn-ration-scale.git` },
  { name: 'Calculator-Library-Portal', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/Calculator-Library-Portal.git` },
  { name: 'startknowledge', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/startknowledge.git` },
  { name: 'pension-calculator', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/pension-calculator.git` },
  { name: 'design-painting', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/design-painting.git` },
  { name: 'ai-mosaic-studio', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/ai-mosaic-studio.git` },
  { name: 'ultra-static-seo-engine', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/ultra-static-seo-engine.git` }
];

const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 'documentation.html', 'changelog.html'];

// ========== HELPER: CLONE OR UPDATE REPO ==========
async function prepareRepo(repoName, repoUrl) {
  const repoPath = path.join(TEMP_DIR, repoName);
  if (fs.existsSync(repoPath)) {
    console.log(`🔄 Pulling latest changes for ${repoName}...`);
    const git = simpleGit(repoPath);
    await git.fetch();
    await git.pull();
  } else {
    console.log(`📦 Cloning ${repoName}...`);
    await simpleGit().clone(repoUrl, repoPath);
  }
  return repoPath;
}

// ========== KEYWORD FETCHING ==========
async function getTrendingKeywords(seed, repoName) {
  if (repoName === 'ultra-static-seo-engine') {
    return [
      'programmatic SEO best practices',
      'auto blog generation for SEO',
      'Google Indexing API tutorial',
      'semantic SEO strategies 2026',
      'E-E-A-T signals for ranking',
      'multi-language SEO automation'
    ];
  }
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(seed)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const feed = await parser.parseURL(url);
    const keywords = [];
    for (const item of feed.items) {
      let title = item.title;
      title = title.replace(/\s*[–—-]\s*.*$/, '').replace(/\s*\|\s*.*$/, '').trim();
      if (title.length > 10 && !keywords.includes(title)) {
        keywords.push(title);
      }
      if (keywords.length >= 6) break;
    }
    if (keywords.length === 0) throw new Error('No news');
    return keywords;
  } catch (e) {
    console.error(`❌ No keywords for ${seed}`);
    throw new Error(`No keywords`);
  }
}

// ========== AI CONTENT ==========
async function generateBlogContent(keyword, repoName) {
  // Try multiple API keys if available
  const apiKeys = [process.env.GROQ_API_KEY1, process.env.GROQ_API_KEY2].filter(Boolean);
  for (const key of apiKeys) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: `Write a detailed, SEO-optimized blog post (2000+ words) about "${keyword}" for the website "${repoName}". Include: title, intro with stats, 5 strategies, examples, mistakes, FAQ, conclusion. Use H2/H3.` }],
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` }, timeout: 30000 });
      let content = response.data.choices[0].message.content;
      content = content.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                       .replace(/^## (.*?)$/gm, '<h2>$2</h2>')
                       .replace(/\n/g, '<br>');
      return content;
    } catch (err) {
      console.warn(`AI failed with key: ${err.message}`);
      continue;
    }
  }
  // Fallback if all keys fail
  console.log(`Using fallback content for: ${keyword}`);
  return `<p>Complete guide to ${keyword}. Learn actionable strategies.</p>
<h2>Why ${keyword} matters</h2>
<p>Understanding ${keyword} is crucial for success in 2026.</p>
<h2>Key strategies</h2>
<ul><li>Strategy 1: Research and plan</li><li>Strategy 2: Implement effectively</li><li>Strategy 3: Measure and optimize</li></ul>
<h2>FAQ</h2>
<p><strong>What is ${keyword}?</strong> It's the process of achieving goals through systematic approaches.</p>`;
}

// ========== SITEMAP UPDATE ==========
function updateSitemap(repoPath, repoName, newUrl, lastmod) {
  const sitemapPath = path.join(repoPath, 'sitemap.xml');
  let sitemap = '';
  if (fs.existsSync(sitemapPath)) {
    sitemap = fs.readFileSync(sitemapPath, 'utf8');
    if (!sitemap.includes(newUrl)) {
      const urlEntry = `  <url>\n    <loc>${newUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
      sitemap = sitemap.replace('</urlset>', `${urlEntry}</urlset>`);
    }
  } else {
    sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://${repoName}.startknowledge.in/</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n</urlset>`;
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

// ========== GENERATE BLOG INDEX (blog/index.html) ==========
function generateBlogIndex(repoPath, repoName, blogs) {
  const blogListHtml = blogs.map(blog => `
    <article class="blog-card">
      <img src="${blog.image}" alt="${blog.title}">
      <div class="blog-info">
        <h3><a href="${blog.url}">${blog.title}</a></h3>
        <p>${blog.excerpt}</p>
        <span class="date">${blog.date}</span>
      </div>
    </article>
  `).join('');
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Blog - ${repoName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:sans-serif;background:#f5f7fb;padding:20px;}
.container{max-width:1200px;margin:auto;}
.blog-card{background:white;border-radius:24px;overflow:hidden;margin-bottom:20px;display:flex;}
.blog-card img{width:200px;height:150px;object-fit:cover;}
.blog-info{padding:20px;}
@media(max-width:700px){.blog-card{flex-direction:column;}.blog-card img{width:100%;}}
</style>
</head>
<body>
<div class="container">
<h1>Blog | ${repoName}</h1>
${blogListHtml}
<footer><a href="/">Home</a></footer>
</div>
</body>
</html>`;
  const indexPath = path.join(repoPath, 'blog', 'index.html');
  fs.ensureDirSync(path.dirname(indexPath));
  fs.writeFileSync(indexPath, html);
  console.log(`📚 Blog index: ${indexPath}`);
}

// ========== STATIC PAGES ==========
function ensureStaticPages(repoPath, repoName) {
  STATIC_PAGES.forEach(page => {
    const pagePath = path.join(repoPath, page);
    if (!fs.existsSync(pagePath)) {
      const title = page.replace('.html', '').charAt(0).toUpperCase() + page.replace('.html', '').slice(1);
      const content = `<!DOCTYPE html><html><head><title>${title} - ${repoName}</title></head><body><h1>${title}</h1><p><a href="/">Home</a></p></body></html>`;
      fs.writeFileSync(pagePath, content);
    }
  });
}

// ========== PROCESS SINGLE REPO ==========
async function processRepo(repo) {
  console.log(`\n--- Processing ${repo.name} ---`);
  const repoPath = await prepareRepo(repo.name, repo.url);
  const blogDir = path.join(repoPath, 'blog');
  fs.ensureDirSync(blogDir);
  fs.ensureDirSync(path.join(repoPath, 'images'));
  ensureStaticPages(repoPath, repo.name);

  // Special handling for ultra-static-seo-engine: preserve custom root index.html
  if (repo.name === 'ultra-static-seo-engine') {
    const customIndex = path.join(repoPath, 'index.html');
    if (!fs.existsSync(customIndex)) {
      console.warn(`⚠️ Missing custom index.html in ${repo.name}. Please add it manually.`);
    } else {
      console.log(`🛡️ Preserved custom index.html for ${repo.name}`);
    }
  }

  const seed = repo.name.replace(/-/g, ' ');
  let keywords;
  try {
    keywords = await getTrendingKeywords(seed, repo.name);
  } catch (err) {
    console.error(`❌ Skipping ${repo.name} - no keywords`);
    return;
  }
  console.log(`📈 Keywords:`, keywords);

  const blogs = [];
  for (const kw of keywords) {
    const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
    const blogPath = path.join(blogDir, `${slug}.html`);
    console.log(`📝 Generating: ${kw.substring(0, 60)}...`);
    const content = await generateBlogContent(kw, repo.name);
    const imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/800/400`;
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${kw} | ${repo.name}</title>
<meta name="description" content="Complete guide to ${kw}">
<link rel="canonical" href="https://${repo.name}.startknowledge.in/blog/${slug}.html">
<meta property="og:image" content="${imageUrl}">
<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;}</style>
</head>
<body>
<article><img src="${imageUrl}" alt="${kw}" style="width:100%"><h1>${kw}</h1>${content}</article>
<footer><a href="/">Home</a> | <a href="index.html">Blog Index</a></footer>
</body>
</html>`;
    fs.writeFileSync(blogPath, html);
    const fullUrl = `https://${repo.name}.startknowledge.in/blog/${slug}.html`;
    updateSitemap(repoPath, repo.name, fullUrl, new Date().toISOString());
    blogs.push({
      title: kw,
      url: `${slug}.html`,
      image: imageUrl,
      excerpt: `Complete guide to ${kw.substring(0, 100)}...`,
      date: new Date().toLocaleDateString()
    });
  }

  if (blogs.length) {
    generateBlogIndex(repoPath, repo.name, blogs);
    // Commit and push changes
    const git = simpleGit(repoPath);
    // Set git user for this repository (fixes "Author identity unknown")
    await git.addConfig('user.name', 'seo-bot', false, 'local');
    await git.addConfig('user.email', 'bot@seo.com', false, 'local');
    await git.add('.');
    const status = await git.status();
    if (status.files.length > 0) {
      await git.commit('🤖 Auto-generate blogs from Google Trends');
      const branchSummary = await git.branch();
      const currentBranch = branchSummary.current;
      await git.push('origin', currentBranch);
      console.log(`✅ Pushed updates to ${repo.name} (${currentBranch})`);
    } else {
      console.log(`📭 No changes to commit for ${repo.name}`);
    }
  }
  console.log(`✅ Completed ${repo.name} | ${blogs.length} blogs`);
}

// ========== MAIN ==========
async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable not set (ALL_REPO or MY_GITHUB_TOKEN)');
    process.exit(1);
  }
  fs.ensureDirSync(TEMP_DIR);
  for (const repo of REPOS) {
    await processRepo(repo);
  }
  console.log('🔥 SYSTEM COMPLETE');
}

main().catch(console.error);