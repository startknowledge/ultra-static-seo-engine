// engine/core.js (CommonJS version)
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

// ========== CONFIG ==========
/* const PROCESSED_FILE = 'config/processed-repos.json';
let processedRepos = fs.existsSync(PROCESSED_FILE) ? JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')) : {};
 */
// List of static pages that should be in repo root (created if missing)
const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 'documentation.html', 'changelog.html'];

// Special index.html for ultra-static-seo-engine (your beautiful design)
// You must place the file at: docs/ultra-static-seo-engine/index.html
// The script will restore it if missing.

// ========== HELPERS ==========
async function getTrendingKeywords(seed) {
  // Use Google Trends RSS feed (daily trending searches)
  const url = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US';
  try {
    const feed = await parser.parseURL(url);
    // Return up to 10 unique keywords related to the seed
    const keywords = feed.items.slice(0, 10).map(item => item.title);
    // Filter those that contain the seed or are relevant (simple heuristic)
    return keywords.filter(k => k.toLowerCase().includes(seed.toLowerCase()) || Math.random() > 0.5).slice(0, 6);
  } catch (e) {
    console.warn('Trends RSS failed, using fallback:', e.message);
    return [`${seed} strategies`, `best ${seed} tools`, `how to ${seed}`, `${seed} for beginners`, `advanced ${seed}`, `${seed} trends 2026`];
  }
}

async function generateBlogContent(keyword, repoName) {
  // Use Groq API (or fallback)
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
    // Convert markdown-like headings to HTML
    content = content.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                     .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
                     .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
                     .replace(/\n/g, '<br>');
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

function generateRepoIndex(repo, blogs) {
  // Create a beautiful index.html in repo root that lists all blogs with images
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
  <title>${repo} | Programmatic SEO Blog</title>
  <meta name="description" content="Latest insights on programmatic SEO, auto backlinks, and digital marketing.">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#f5f7fb; color:#1a2c3e; line-height:1.5; }
    .container { max-width:1200px; margin:0 auto; padding:0 24px; }
    header { background:white; border-bottom:1px solid #e9eef3; position:sticky; top:0; padding:20px 0; }
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
      <div class="logo"><h1>⚡ ${repo}</h1><span>programmatic SEO · auto blogs</span></div>
    </div>
  </header>
  <main class="container">
    <h2 style="margin:40px 0 20px">Latest Blog Posts</h2>
    <div class="blog-grid">
      ${blogListHtml}
    </div>
  </main>
  <footer>
    <p>© ${new Date().getFullYear()} ${repo} — Auto‑generated with Google Trends & AI</p>
  </footer>
</body>
</html>`;
  
  fs.writeFileSync(`docs/${repo}/index.html`, html);
  console.log(`🏠 Generated/Updated root index.html for ${repo}`);
}

function ensureStaticPages(repo) {
  const repoRoot = `docs/${repo}`;
  STATIC_PAGES.forEach(page => {
    const pagePath = path.join(repoRoot, page);
    if (!fs.existsSync(pagePath)) {
      const title = page.replace('.html', '').charAt(0).toUpperCase() + page.replace('.html', '').slice(1);
      const content = `<!DOCTYPE html><html><head><title>${title} - ${repo}</title><meta charset="UTF-8"></head><body><h1>${title}</h1><p>This page is auto-generated. Customize as needed.</p><p><a href="/">Back to home</a></p></body></html>`;
      fs.writeFileSync(pagePath, content);
      console.log(`📄 Created missing page: ${pagePath}`);
    }
  });
}

// ========== MAIN PROCESSING ==========
async function processRepo(repo) {
  const force = process.argv.includes('--force');
/*   if (!force && processedRepos[repo]) {
    console.log(`⏭️ Skipping ${repo} – already processed on ${processedRepos[repo]}`);
    return;
  } */

  console.log(`\n--- Processing ${repo} ---`);
  const repoDir = `docs/${repo}`;
  fs.ensureDirSync(repoDir);
  fs.ensureDirSync(`${repoDir}/blog`);
  fs.ensureDirSync(`${repoDir}/images`);

  // Ensure static pages exist in root (not in /pages/)
  ensureStaticPages(repo);

  // Special protection for ultra-static-seo-engine's custom index.html
  if (repo === 'ultra-static-seo-engine') {
    const customIndex = path.join(repoDir, 'index.html');
    if (!fs.existsSync(customIndex) || force) {
      // The custom HTML should be placed manually at docs/ultra-static-seo-engine/index.html
      // We'll not overwrite it – just warn if missing
      if (!fs.existsSync(customIndex)) {
        console.warn(`⚠️ Missing custom index.html for ${repo}. Please place your design at ${customIndex}`);
      } else {
        console.log(`🛡️ Preserved custom index.html for ${repo}`);
      }
    }
  }

  // Get trending keywords based on repo name
  const seed = repo.replace(/-/g, ' ');
  const keywords = await getTrendingKeywords(seed);
  console.log(`📈 Trending keywords for ${repo}:`, keywords);

  let blogs = [];
  for (const kw of keywords) {
    const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const blogPath = `${repoDir}/blog/${slug}.html`;
    /* if (fs.existsSync(blogPath) && !force) {
      console.log(`⏩ Blog already exists: ${slug}`);
      // Still add to index even if exists
      blogs.push({
        title: kw,
        url: `/blog/${slug}.html`,
        image: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/400/200`,
        excerpt: `Read our latest guide on ${kw}. Learn actionable strategies.`,
        date: new Date().toLocaleDateString()
      });
      continue;
    } */
    console.log(`📝 Generating blog for keyword: ${kw}`);
    const content = await generateBlogContent(kw, repo);
    // Try to fetch an image from Unsplash (optional)
    let imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/800/400`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${kw} | ${repo}</title>
  <meta name="description" content="Complete guide to ${kw}. Learn strategies, tools, and best practices.">
  <link rel="canonical" href="https://${repo}.startknowledge.in/blog/${slug}.html">
  <meta property="og:image" content="${imageUrl}">
  <style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;line-height:1.6;}img{max-width:100%;}</style>
</head>
<body>
  <article>
    <img src="${imageUrl}" alt="${kw}" style="width:100%; border-radius:12px;">
    <h1>${kw}</h1>
    ${content}
  </article>
  <footer><p>© ${new Date().getFullYear()} ${repo} | <a href="/">Home</a></p></footer>
</body>
</html>`;
    fs.writeFileSync(blogPath, html);
    console.log(`✅ Blog: https://${repo}.startknowledge.in/blog/${slug}.html`);
    
    // Update sitemap
    updateSitemap(repo, `https://${repo}.startknowledge.in/blog/${slug}.html`);
    
    blogs.push({
      title: kw,
      url: `/blog/${slug}.html`,
      image: imageUrl,
      excerpt: `Complete guide to ${kw} – expert insights and actionable tips.`,
      date: new Date().toLocaleDateString()
    });
  }

  // Generate root index.html that lists all blogs
  if (blogs.length > 0) {
    generateRepoIndex(repo, blogs);
  } else {
    console.log(`⚠️ No blogs generated for ${repo}, skipping index update.`);
  }

  // Mark as processed
  /* processedRepos[repo] = new Date().toISOString();
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedRepos, null, 2)); */
  console.log(`✅ Completed ${repo} | ${blogs.length} blogs in index`);
}

// ========== ENTRY POINT ==========
async function main() {
  // List of repos to process (auto-fetched from GitHub if you want, but static list is fine)
  const repos = ['bn-ration-scale', 'Calculator-Library-Portal', 'startknowledge', 'pension-calculator', 'ultra-static-seo-engine'];
  
  for (const repo of repos) {
    await processRepo(repo);
  }
  
  console.log('🔥 SYSTEM COMPLETE');
}

main().catch(console.error);