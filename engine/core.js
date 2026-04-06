// engine/core.js - Full SEO automation with internal links, schema, advanced CSS
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

// All repositories (add new ones here)
const REPOS = [
  { name: 'bn-ration-scale', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/bn-ration-scale.git` },
  { name: 'Calculator-Library-Portal', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/Calculator-Library-Portal.git` },
  { name: 'startknowledge', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/startknowledge.git` },
  { name: 'pension-calculator', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/pension-calculator.git` },
  { name: 'design-painting', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/design-painting.git` },
  { name: 'ai-mosaic-studio', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/ai-mosaic-studio.git` },
  { name: 'ultra-static-seo-engine', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/ultra-static-seo-engine.git` },
  { name: 'universal-image-data-explorer-forge', url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/universal-image-data-explorer-forge.git` }
];

const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 'documentation.html', 'changelog.html'];

// High‑authority external backlinks (used in every blog post)
const EXTERNAL_BACKLINKS = [
  { title: 'Google Search Central – SEO Starter Guide', url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' },
  { title: 'Moz Beginner’s Guide to SEO', url: 'https://moz.com/beginners-guide-to-seo' },
  { title: 'Google Search Console', url: 'https://search.google.com/search-console/about' },
  { title: 'Ahrefs Blog – SEO Strategies', url: 'https://ahrefs.com/blog/' },
  { title: 'Semrush SEO Toolkit', url: 'https://www.semrush.com/blog/' },
  { title: 'Yoast SEO Academy', url: 'https://yoast.com/academy/' },
  { title: 'Backlinko – SEO Techniques', url: 'https://backlinko.com/blog' },
  { title: 'Search Engine Journal', url: 'https://www.searchenginejournal.com/' },
  { title: 'Google PageSpeed Insights', url: 'https://pagespeed.web.dev/' },
  { title: 'Schema.org – Structured Data', url: 'https://schema.org/' }
];

// ========== HELPERS ==========
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
    'AI content generation for blogs',
    'long tail keyword automation',
    'technical SEO automation tools',
    'internal linking automation strategy',
    'dynamic sitemap generation SEO',
    'schema markup automation guide',
    'headless CMS SEO setup',
    'zero click search optimization',
    'programmatic SEO best practices',
    'auto blog generation for SEO',
    'Google Indexing API tutorial',
    'semantic SEO strategies 2026',
    'E-E-A-T signals for ranking',
    'multi-language SEO automation',    
    'featured snippets optimization tips',
    'AI keyword clustering techniques',
    'SEO content scaling strategies',
    'automated meta tags generation',
    'bulk page generation SEO',
    'content silo structure SEO',
    'topical authority building strategy',
    'AI SEO tools comparison 2026',
    'search intent optimization guide',
    'automated backlink generation myths',
    'Google search console automation',
    'SEO analytics automation dashboard',
    'content freshness automation SEO',
    'AI blog writing workflow',
    'SEO A/B testing automation',
    'auto schema generator tool',
    'voice search SEO optimization',
    'entity based SEO strategy',
    'NLP SEO optimization techniques',
    'AI powered content briefs',
    'SEO automation with APIs',
    'indexing issues troubleshooting SEO',
    'crawl budget optimization automation',
    'SEO friendly URL generation',
    'automated image SEO optimization',
    'core web vitals optimization automation',
    'AI SEO audit tools guide',
    'content gap analysis automation',
    'SERP tracking automation tools',
    'keyword cannibalization fix SEO',
    'AI link building strategies',
    'SEO automation pipelines',
    'real time SEO monitoring system',
    'automated blog publishing workflow',
    'SEO performance tracking automation',
    'AI driven niche site building'
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

// ========== AI CONTENT (3500+ words) ==========
async function generateBlogContent(keyword, repoName, allBlogsForRepo = []) {
  const apiKeys = [process.env.GROQ_API_KEY1, process.env.GROQ_API_KEY2].filter(Boolean);
  let content = '';
  for (const key of apiKeys) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.3-70b-versatile",
        max_tokens: 3500,
        messages: [{ role: 'user', content: `Write a very detailed, SEO-optimized blog post (at least 3500 words) about "${keyword}" for the website "${repoName}". 
Use proper HTML structure: <h1>Title</h1>, <h2>Subheadings</h2>, <p>, <ul>, <li>. Include:
- An engaging title with the keyword
- Introduction with recent statistics (cite years)
- 8–10 actionable strategies or tips
- Real‑world examples
- Common mistakes and how to avoid them
- FAQ section (5 questions) with schema markup (Question/Answer)
- Conclusion with a strong call‑to‑action
Write naturally, use bold and italics where appropriate.` }],
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` }, timeout: 60000 });
      content = response.data.choices[0].message.content;
      // Convert markdown headings to HTML if needed
      content = content.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                       .replace(/^## (.*?)$/gm, '<h2>$2</h2>')
                       .replace(/^### (.*?)$/gm, '<h3>$3</h3>')
                       .replace(/\n/g, '<br>');
      break;
    } catch (err) {
      console.warn(`AI failed with key: ${err.message}`);
      continue;
    }
  }
  if (!content) {
    content = `<p>Complete guide to ${keyword}. Learn actionable strategies to master ${keyword} in 2026.</p>
<h2>Why ${keyword} matters</h2><p>Understanding ${keyword} is crucial for success.</p>
<h2>Key strategies</h2><ul><li>Research thoroughly</li><li>Implement step by step</li><li>Measure and optimize</li></ul>
<h2>FAQ</h2><p><strong>What is ${keyword}?</strong> It's a process to achieve goals.</p>`;
  }

  // --- Internal links (related posts from same repo) ---
  let internalLinksHtml = '';
  if (allBlogsForRepo.length > 1) {
    const otherBlogs = allBlogsForRepo.filter(b => b.title !== keyword);
    const related = otherBlogs.slice(0, 4);
    if (related.length) {
      internalLinksHtml = '<h3>📚 You May Also Like</h3><ul>';
      for (const blog of related) {
        internalLinksHtml += `<li><a href="${blog.url}">${blog.title}</a></li>`;
      }
      internalLinksHtml += '</ul>';
    }
  }
  // Add a link back to the blog index
  internalLinksHtml += '<p><a href="index.html">← Browse all blog posts</a></p>';

  // --- Cross‑repo internal links (links to other repos' homepages) ---
  const crossRepoLinks = REPOS.filter(r => r.name !== repoName).map(r => 
    `<li><a href="https://${r.name}.startknowledge.in/">${r.name.replace(/-/g, ' ')}</a></li>`
  ).join('');
  const crossRepoHtml = `<h3>🌐 Explore Our Other Sites</h3><ul>${crossRepoLinks}</ul>`;

  // --- External backlinks (10 high authority links) ---
  const externalHtml = `<h3>🔗 Useful Resources (External)</h3><ul>${EXTERNAL_BACKLINKS.map(link => 
    `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></li>`
  ).join('')}</ul>`;

  // Combine all
  return content + internalLinksHtml + crossRepoHtml + externalHtml;
}

// ========== GENERATE JSON-LD SCHEMA ==========
function generateSchema(keyword, repoName, slug, imageUrl, date) {
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${keyword.replace(/"/g, '\\"')}",
  "description": "Complete guide to ${keyword.replace(/"/g, '\\"')} – strategies, tips, and best practices.",
  "author": {
    "@type": "Organization",
    "name": "${repoName}"
  },
  "datePublished": "${date}",
  "dateModified": "${new Date().toISOString()}",
  "image": "${imageUrl}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://${repoName}.startknowledge.in/blog/${slug}.html"
  }
}
</script>`;
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

// ========== GENERATE NAVIGATION LINKS (static pages + home + blog) ==========
function generateNavLinks(currentRepo) {
  let links = `<li><a href="/">Home</a></li><li><a href="index.html">Blog</a></li>`;
  for (const page of STATIC_PAGES) {
    const name = page.replace('.html', '');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    links += `<li><a href="/${page}">${displayName}</a></li>`;
  }
  return links;
}

// ========== UPDATE BLOG INDEX (posts.json + navigation) ==========
async function updatePostsJsonAndIndex(repoPath, repoName, newBlogs) {
  const blogDir = path.join(repoPath, 'blog');
  const postsJsonPath = path.join(blogDir, 'posts.json');
  const indexPath = path.join(blogDir, 'index.html');
  const templatePath = path.join(__dirname, '..', 'templates', 'blog-index.html');

  // Build posts.json incrementally
  const files = fs.readdirSync(blogDir);
  const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html');
  const postsMap = new Map();
  if (fs.existsSync(postsJsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
      existing.forEach(post => postsMap.set(post.url, post));
    } catch(e) {}
  }
  for (const file of htmlFiles) {
    const filePath = path.join(blogDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let titleMatch = content.match(/<h1>(.*?)<\/h1>/);
    let title = titleMatch ? titleMatch[1] : file.replace('.html', '').replace(/-/g, ' ');
    let excerpt = content.substring(0, 200).replace(/<[^>]*>/g, '').substring(0, 120);
    let imageMatch = content.match(/<img[^>]+src="([^">]+)"/);
    let image = imageMatch ? imageMatch[1] : `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/800/400`;
    let dateMatch = content.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    let date = dateMatch ? dateMatch[0] : new Date().toLocaleDateString();
    const url = file;
    if (!postsMap.has(url)) {
      postsMap.set(url, { title, url, image, excerpt: excerpt + '...', date });
    }
  }
  for (const blog of newBlogs) {
    if (!postsMap.has(blog.url)) postsMap.set(blog.url, blog);
  }
  const allPosts = Array.from(postsMap.values());
  fs.writeFileSync(postsJsonPath, JSON.stringify(allPosts, null, 2));
  console.log(`📄 Updated posts.json (${allPosts.length} total posts)`);

  // Ensure blog/index.html exists (copy template if missing)
  if (!fs.existsSync(indexPath) && fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, indexPath);
    console.log(`📄 Copied blog index template to ${indexPath}`);
  }
  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️ No template and no existing index for ${repoName}`);
    return;
  }

  // Update navigation links inside blog/index.html
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  const newNavLinks = generateNavLinks(repoName);
  const navRegex = /(<ul class="nav-links">)([\s\S]*?)(<\/ul>)/;
  if (navRegex.test(indexContent)) {
    indexContent = indexContent.replace(navRegex, `$1${newNavLinks}$3`);
    fs.writeFileSync(indexPath, indexContent);
    console.log(`🔄 Updated navigation links in ${indexPath}`);
  } else {
    console.warn(`⚠️ Could not find nav-links ul in ${indexPath}`);
  }
}

// ========== STATIC PAGES ==========
function ensureStaticPages(repoPath, repoName) {
  STATIC_PAGES.forEach(page => {
    const pagePath = path.join(repoPath, page);
    if (!fs.existsSync(pagePath)) {
      const title = page.replace('.html', '').charAt(0).toUpperCase() + page.replace('.html', '').slice(1);
      const content = `<!DOCTYPE html><html><head><title>${title} - ${repoName}</title><meta charset="UTF-8"></head><body><h1>${title}</h1><p><a href="/">Home</a> | <a href="blog/index.html">Blog</a></p></body></html>`;
      fs.writeFileSync(pagePath, content);
      console.log(`📄 Created missing static page: ${pagePath}`);
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
      console.warn(`⚠️ Missing custom root index.html for ${repo.name}. Please add it manually.`);
    } else {
      console.log(`🛡️ Preserved custom root index.html for ${repo.name}`);
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

  // Prepare data for internal linking
  const allBlogsData = keywords.map(kw => ({
    title: kw,
    url: `/${kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100)}.html`
  }));

  const blogs = [];
  for (const kw of keywords) {
    const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
    const blogPath = path.join(blogDir, `${slug}.html`);
    console.log(`📝 Generating: ${kw.substring(0, 60)}...`);
    const content = await generateBlogContent(kw, repo.name, allBlogsData);
    const imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/1200/630`;
    const publishDate = new Date().toISOString().split('T')[0];
    const schema = generateSchema(kw, repo.name, slug, imageUrl, publishDate);
    const metaDesc = `Complete guide to ${kw}. Learn actionable strategies, avoid common mistakes, and master ${kw} in 2026.`;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${kw} | ${repo.name}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="keywords" content="${kw.toLowerCase()}, SEO, guide, tips, strategies">
  <link rel="canonical" href="https://${repo.name}.startknowledge.in/blog/${slug}.html">
  <meta property="og:title" content="${kw} | ${repo.name}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${kw}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${imageUrl}">
  ${schema}
  <style>
    /* Advanced CSS: gradient, smooth scroll, card hover effects */
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, 'Inter', sans-serif; background: linear-gradient(145deg, #f9fafc 0%, #f0f4f9 100%); color: #1a2c3e; line-height: 1.6; padding: 20px; scroll-behavior: smooth; }
    .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 32px; box-shadow: 0 25px 45px -12px rgba(0,0,0,0.2); overflow: hidden; transition: transform 0.2s; }
    article { padding: 40px; }
    img { max-width: 100%; border-radius: 20px; margin: 20px 0; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
    h1 { font-size: 2.5rem; margin-bottom: 20px; background: linear-gradient(135deg, #0f2b3d, #1e6f5c); background-clip: text; -webkit-background-clip: text; color: transparent; }
    h2 { font-size: 1.8rem; margin: 30px 0 15px; border-left: 5px solid #1e6f5c; padding-left: 15px; }
    h3 { font-size: 1.4rem; margin: 25px 0 10px; color: #2c4b66; }
    p { margin-bottom: 1.2rem; }
    ul, ol { margin: 15px 0 15px 30px; }
    a { color: #1e6f5c; text-decoration: none; border-bottom: 1px solid transparent; transition: 0.2s; }
    a:hover { border-bottom-color: #1e6f5c; }
    footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    @media (max-width: 700px) { article { padding: 20px; } h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
<div class="container">
  <article>
    <img src="${imageUrl}" alt="${kw}" style="width:100%">
    ${content}
  </article>
  <footer>
    <p>© ${new Date().getFullYear()} ${repo.name} | <a href="/">Home</a> | <a href="index.html">Blog Index</a></p>
  </footer>
</div>
</body>
</html>`;
    fs.writeFileSync(blogPath, html);
    const fullUrl = `https://${repo.name}.startknowledge.in/blog/${slug}.html`;
    updateSitemap(repoPath, repo.name, fullUrl, new Date().toISOString());
    blogs.push({
      title: kw,
      url: `${slug}.html`,
      image: imageUrl,
      excerpt: metaDesc.substring(0, 120),
      date: publishDate
    });
  }

  if (blogs.length) {
    await updatePostsJsonAndIndex(repoPath, repo.name, blogs);
    const git = simpleGit(repoPath);
    await git.addConfig('user.name', 'seo-bot', false, 'local');
    await git.addConfig('user.email', 'bot@seo.com', false, 'local');
    await git.add('.');
    const status = await git.status();
    if (status.files.length > 0) {
      await git.commit('🤖 Auto-generate long‑form SEO blogs with internal links & schema');
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