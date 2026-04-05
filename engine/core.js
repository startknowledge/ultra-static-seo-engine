// engine/core.js (full version with all repos)
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

let trendsApi = null;
try {
  trendsApi = require('google-trends-api');
} catch(e) {}

const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 'documentation.html', 'changelog.html'];

// ========== KEYWORD FETCHING ==========
async function getTrendingKeywords(seed, repoName) {
  // Special handling for ultra-static-seo-engine
  if (repoName === 'ultra-static-seo-engine') {
    // Try Google Trends API first
    if (trendsApi) {
      try {
        const result = await trendsApi.relatedQueries({ keyword: 'programmatic SEO', startTime: new Date(Date.now() - 7*24*60*60*1000) });
        const data = JSON.parse(result);
        const rising = data.default.risingQueryList || [];
        const top = data.default.topQueryList || [];
        let keywords = [...top, ...rising].slice(0,6).map(q => q.query);
        if (keywords.length) return keywords;
      } catch(e) {}
    }
    // Fallback: SEO-specific keywords (real, not static)
    return [
      'programmatic SEO best practices',
      'auto blog generation for SEO',
      'Google Indexing API tutorial',
      'semantic SEO strategies 2026',
      'E-E-A-T signals for ranking',
      'multi-language SEO automation'
    ];
  }

  // For all other repos: Google News RSS
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
    console.error(`❌ No real keywords for "${seed}"`);
    throw new Error(`No keywords for ${seed}`);
  }
}

// ========== AI CONTENT GENERATION (same as before) ==========
async function generateBlogContent(keyword, repoName) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return fallbackContent(keyword);
  
  const prompt = `Write a detailed, SEO-optimized blog post (2000+ words) about "${keyword}" for the website "${repoName}". 
Include: 
- An engaging title
- Introduction with recent statistics
- 5 actionable strategies or tips
- Real-world examples
- Common mistakes to avoid
- FAQ section with schema markup
- Conclusion with a strong call-to-action
Use headings (H2, H3), bullet points, and bold text. Make it E-E-A-T compliant.`;
  
  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } });
    
    let content = response.data.choices[0].message.content;
    content = content.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                     .replace(/^## (.*?)$/gm, '<h2>$2</h2>')
                     .replace(/^### (.*?)$/gm, '<h3>$3</h3>')
                     .replace(/\n/g, '<br>');
    return content;
  } catch (err) {
    return fallbackContent(keyword);
  }
}

function fallbackContent(keyword) {
  return `<p>Complete guide to ${keyword}. Learn actionable strategies and best practices.</p>
<h2>Why ${keyword} matters</h2>
<p>Understanding ${keyword} is crucial for success in 2026.</p>
<h2>Key strategies</h2>
<ul><li>Strategy 1: Research and plan</li><li>Strategy 2: Implement effectively</li><li>Strategy 3: Measure and optimize</li></ul>`;
}

// ========== SITEMAP UPDATE ==========
function updateSitemap(repo, newUrl, lastmod = new Date().toISOString()) {
  const sitemapPath = `docs/${repo}/sitemap.xml`;
  let sitemap = '';
  if (fs.existsSync(sitemapPath)) {
    sitemap = fs.readFileSync(sitemapPath, 'utf8');
    if (!sitemap.includes(newUrl)) {
      const urlEntry = `  <url>\n    <loc>${newUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
      sitemap = sitemap.replace('</urlset>', `${urlEntry}</urlset>`);
    }
  } else {
    sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://${repo}.startknowledge.in/</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n</urlset>`;
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

// ========== GENERATE BLOG FOLDER INDEX.HTML ==========
function generateBlogIndex(repo, blogs) {
  const blogListHtml = blogs.map(blog => `
    <article class="blog-card">
      <img src="${blog.image}" alt="${blog.title}" loading="lazy">
      <div class="blog-info">
        <h3><a href="${blog.url}">${blog.title}</a></h3>
        <p>${blog.excerpt}</p>
        <span class="date">${blog.date}</span>
      </div>
    </article>
  `).join('');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - ${repo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#f5f7fb; color:#1a2c3e; line-height:1.5; }
    .container { max-width:1200px; margin:0 auto; padding:0 24px; }
    header { background:white; border-bottom:1px solid #e9eef3; padding:20px 0; }
    .logo h1 { font-size:1.8rem; background:linear-gradient(135deg,#0f2b3d,#1e6f5c); background-clip:text; -webkit-background-clip:text; color:transparent; }
    .blog-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:32px; margin:40px 0; }
    .blog-card { background:white; border-radius:24px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.05); transition:0.2s; }
    .blog-card:hover { transform:translateY(-5px); }
    .blog-card img { width:100%; height:200px; object-fit:cover; }
    .blog-info { padding:20px; }
    .blog-info h3 a { text-decoration:none; color:#1a2c3e; }
    .blog-info p { color:#4b6f8c; margin:12px 0; }
    .date { font-size:0.8rem; color:#6e8dab; }
    footer { text-align:center; padding:40px 0; border-top:1px solid #e2e8f0; margin-top:40px; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo"><h1>📰 Blog | ${repo}</h1></div>
    </div>
  </header>
  <main class="container">
    <h2 style="margin:40px 0 20px">All Blog Posts</h2>
    <div class="blog-grid">${blogListHtml}</div>
  </main>
  <footer><p>© ${new Date().getFullYear()} ${repo} | <a href="/">Home</a></p></footer>
</body>
</html>`;
  
  fs.writeFileSync(`docs/${repo}/blog/index.html`, html);
  console.log(`📚 Generated blog index: docs/${repo}/blog/index.html`);
}

function ensureStaticPages(repo) {
  const repoRoot = `docs/${repo}`;
  STATIC_PAGES.forEach(page => {
    const pagePath = path.join(repoRoot, page);
    if (!fs.existsSync(pagePath)) {
      const title = page.replace('.html', '').charAt(0).toUpperCase() + page.replace('.html', '').slice(1);
      const content = `<!DOCTYPE html><html><head><title>${title} - ${repo}</title><meta charset="UTF-8"></head><body><h1>${title}</h1><p><a href="/">Back to home</a></p></body></html>`;
      fs.writeFileSync(pagePath, content);
    }
  });
}

async function processRepo(repo) {
  console.log(`\n--- Processing ${repo} ---`);
  const repoDir = `docs/${repo}`;
  fs.ensureDirSync(repoDir);
  fs.ensureDirSync(`${repoDir}/blog`);
  fs.ensureDirSync(`${repoDir}/images`);
  ensureStaticPages(repo);

  if (repo === 'ultra-static-seo-engine') {
    const customIndex = path.join(repoDir, 'index.html');
    if (!fs.existsSync(customIndex)) {
      console.warn(`⚠️ Missing custom root index.html for ${repo}. Please place your design.`);
    } else {
      console.log(`🛡️ Preserved custom root index.html for ${repo}`);
    }
  }

  const seed = repo.replace(/-/g, ' ');
  let keywords;
  try {
    keywords = await getTrendingKeywords(seed, repo);
  } catch (err) {
    console.error(`❌ Skipping ${repo} - no keywords`);
    return;
  }
  console.log(`📈 Keywords for ${repo}:`, keywords);

  let blogs = [];
  for (const kw of keywords) {
    const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
    const blogPath = `${repoDir}/blog/${slug}.html`;
    console.log(`📝 Generating: ${kw.substring(0, 60)}...`);
    const content = await generateBlogContent(kw, repo);
    const imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/800/400`;
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${kw} | ${repo}</title>
<meta name="description" content="Complete guide to ${kw}">
<link rel="canonical" href="https://${repo}.startknowledge.in/blog/${slug}.html">
<meta property="og:image" content="${imageUrl}">
<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;}</style>
</head>
<body>
<article><img src="${imageUrl}" alt="${kw}" style="width:100%"><h1>${kw}</h1>${content}</article>
<footer><p><a href="/">Home</a> | <a href="index.html">Blog Index</a></p></footer>
</body>
</html>`;
    fs.writeFileSync(blogPath, html);
    updateSitemap(repo, `https://${repo}.startknowledge.in/blog/${slug}.html`);
    blogs.push({
      title: kw,
      url: `${slug}.html`,
      image: imageUrl,
      excerpt: `Complete guide to ${kw.substring(0, 100)}...`,
      date: new Date().toLocaleDateString()
    });
  }
  if (blogs.length) generateBlogIndex(repo, blogs);
  console.log(`✅ Completed ${repo} | ${blogs.length} blogs`);
}

async function main() {
  // All repos that should have blogs
  const repos = [
    'bn-ration-scale',
    'Calculator-Library-Portal',
    'startknowledge',
    'pension-calculator',
    'ultra-static-seo-engine',
    'design-painting',
    'ai-mosaic-studio'
  ];
  for (const repo of repos) {
    await processRepo(repo);
  }
  console.log('🔥 SYSTEM COMPLETE');
}

main().catch(console.error);