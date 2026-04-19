// engine/core.js - Complete SEO automation with money pages, ads, 404 fix, offline AI, RSS feed, Markdown conversion
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();
const simpleGit = require('simple-git');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { rotateMoneyPages } = require('./auto-money-pages.js');

// Setup DOMPurify with a virtual DOM (safe for Node.js)
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// ========== CONFIG ==========
const GITHUB_TOKEN = process.env.ALL_REPO || process.env.MY_GITHUB_TOKEN;
const GITHUB_USER = 'startknowledge';
const TEMP_DIR = path.join(__dirname, '..', 'temp_repos');

const REPOS = [
  { name: 'startknowledge', lowPriority: false },
  { name: 'bn-ration-scale', lowPriority: false },
  { name: 'Calculator-Library-Portal', lowPriority: false },
  { name: 'pension-calculator', lowPriority: false },
  { name: 'design-painting', lowPriority: false },
  { name: 'ai-mosaic-studio', lowPriority: false },
  { name: 'ultra-static-seo-engine', lowPriority: false },
  { name: 'Motionix', lowPriority: false },
  { name: 'universal-image-data-explorer-forge', lowPriority: true }
];

const REPOS_WITH_URL = REPOS.map(repo => ({
  ...repo,
  url: `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${repo.name}.git`
}));

const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 
  'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 
  'documentation.html', 'changelog.html'];

// ========== ADSENSE & ANALYTICS CONFIG ==========
const ADSENSE_CLIENT = 'ca-pub-2162324894765763';
const ADSENSE_SLOTS = {
  top: '1966379200',
  middle: '4441349363',
  bottom: '8024521099',
  fluid: '7592527166'
};
const GA_ID = 'G-Y97JEBHZLV';
const GTM_ID = 'GTM-K435LPQQ';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========== MULTI-AI FALLBACK ENGINE ==========
const AI_PROVIDERS = [
  {
    name: 'Groq',
    apiKeyEnv: ['GROQ_API_KEY1', 'GROQ_API_KEY2'],
    buildRequest: (prompt, key) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 3500, temperature: 0.7 }
    }),
    parseResponse: (res) => res.data.choices[0].message.content
  },
  {
    name: 'Gemini',
    apiKeyEnv: ['GEMINI_API_KEY1', 'GEMINI_API_KEY2'],
    buildRequest: (prompt, key) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      headers: { 'Content-Type': 'application/json' },
      data: { contents: [{ parts: [{ text: prompt }] }] }
    }),
    parseResponse: (res) => res.data.candidates[0].content.parts[0].text
  },
  {
    name: 'OpenRouter',
    apiKeyEnv: ['OPENAI_OPENROUTER1', 'OPENAI_OPENROUTER2'],
    buildRequest: (prompt, key) => ({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: { model: 'mistralai/mistral-7b-instruct:free', messages: [{ role: 'user', content: prompt }], max_tokens: 3500 }
    }),
    parseResponse: (res) => res.data.choices[0].message.content
  },
  {
    name: 'Mistral',
    apiKeyEnv: ['MISTRAL_API_KEY1', 'MISTRAL_API_KEY2'],
    buildRequest: (prompt, key) => ({
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: { model: 'mistral-tiny', messages: [{ role: 'user', content: prompt }], max_tokens: 3500 }
    }),
    parseResponse: (res) => res.data.choices[0].message.content
  },
  {
    name: 'HuggingFace',
    apiKeyEnv: ['HUGGINGFACE_TOKEN1', 'HUGGINGFACE_TOKEN2'],
    buildRequest: (prompt, key) => ({
      url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: { inputs: prompt, parameters: { max_new_tokens: 3500 } }
    }),
    parseResponse: (res) => res.data[0].generated_text
  },
  {
    name: 'Ollama (Local)',
    apiKeyEnv: [],
    buildRequest: (prompt) => ({
      url: 'http://localhost:11434/api/generate',
      headers: { 'Content-Type': 'application/json' },
      data: { model: 'llama3', prompt: prompt, stream: false, options: { num_predict: 3500 } }
    }),
    parseResponse: (res) => res.data.response
  }
];

async function generateContentWithFallback(prompt, repoName) {
  for (const provider of AI_PROVIDERS) {
    const keys = provider.apiKeyEnv.map(env => process.env[env]).filter(Boolean);
    const keyList = keys.length ? keys : [null];
    for (const key of keyList) {
      try {
        const { url, headers, data } = provider.buildRequest(prompt, key);
        const response = await axios.post(url, data, { headers, timeout: 60000 });
        const content = provider.parseResponse(response);
        if (content && content.length > 200) {
          console.log(`✅ AI generated via ${provider.name} for ${repoName}`);
          return content;
        }
      } catch (err) {
        console.warn(`⚠️ ${provider.name} failed: ${err.message}`);
        await delay(1000);
      }
    }
  }
  console.log(`⚠️ All AI providers failed for ${repoName}, using fallback content.`);
  return null;
}

// ========== GENERATE BLOG CONTENT (with Markdown conversion) ==========
async function generateBlogContent(keyword, repoName, allBlogsForRepo, blogPath, forceRegenerate = false) {
  if (!forceRegenerate && fs.existsSync(blogPath)) {
    const stats = fs.statSync(blogPath);
    const ageDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) {
      console.log(`⏩ Skipping ${keyword} – blog younger than 7 days.`);
      const existingHtml = fs.readFileSync(blogPath, 'utf8');
      const match = existingHtml.match(/<article>([\s\S]*?)<\/article>/);
      return match ? match[1] : null;
    }
  }

  const prompt = `Write a very detailed, SEO-optimized blog post (at least 3500 words) about "${keyword}" for the website "${repoName}". 
Use proper HTML structure: <h1>Title</h1>, <h2>Subheadings</h2>, <p>, <ul>, <li>. Include:
- An engaging title with the keyword
- Introduction with recent statistics (cite years)
- 8–10 actionable strategies or tips
- Real‑world examples (describe them, do NOT include any images)
- Common mistakes and how to avoid them
- FAQ section (5 questions) with schema markup (Question/Answer)
- Conclusion with a strong call‑to‑action
Write naturally, use bold and italics where appropriate.
IMPORTANT: Do NOT include any images in your response. Use only text.`;

  let aiContent = await generateContentWithFallback(prompt, repoName);
  
  if (aiContent && !aiContent.includes('<p>') && !aiContent.includes('<h1>')) {
    try {
      aiContent = await marked.parse(aiContent);
      aiContent = DOMPurify.sanitize(aiContent);
      console.log(`🔄 Converted Markdown to HTML for ${keyword}`);
    } catch (err) {
      console.warn(`Markdown conversion failed for ${keyword}: ${err.message}`);
    }
  }
  
  if (aiContent) {
    aiContent = aiContent.replace(/!\[.*?\]\(.*?\)/g, '').replace(/<img[^>]*>/g, '');
  }
  
  if (!aiContent) {
    aiContent = `<p>Complete guide to ${keyword}. Learn actionable strategies to master ${keyword} in 2026.</p>
<h2>Why ${keyword} matters</h2><p>Understanding ${keyword} is crucial for success.</p>
<h2>Key strategies</h2><ul><li>Research thoroughly</li><li>Implement step by step</li><li>Measure and optimize</li></ul>
<h2>FAQ</h2><p><strong>What is ${keyword}?</strong> It's a process to achieve goals.</p>`;
  }

  // Internal + cross-repo + external links
  let internalLinksHtml = '';
  if (allBlogsForRepo.length > 1) {
    const otherBlogs = allBlogsForRepo.filter(b => b.title !== keyword);
    const related = otherBlogs.slice(0, 4);
    if (related.length) {
      internalLinksHtml = '<h3>📚 You May Also Like</h3><ul>';
      for (const blog of related) internalLinksHtml += `<li><a href="${blog.url}">${blog.title}</a></li>`;
      internalLinksHtml += '</ul>';
    }
  }
  internalLinksHtml += '<p><a href="index.html">← Browse all blog posts</a></p>';

  const crossRepoLinks = REPOS_WITH_URL.filter(r => r.name !== repoName).map(r => 
    `<li><a href="https://${r.name}.startknowledge.in/">${r.name.replace(/-/g, ' ')}</a></li>`
  ).join('');
  const crossRepoHtml = `<h3>🌐 Explore Our Other Sites</h3><ul>${crossRepoLinks}</ul>`;

  const externalBacklinks = [
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
  const externalHtml = `<h3>🔗 Useful Resources (External)</h3><ul>${externalBacklinks.map(link => 
    `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></li>`
  ).join('')}</ul>`;

  return aiContent + internalLinksHtml + crossRepoHtml + externalHtml;
}

// ========== ADS & ANALYTICS INJECTION ==========
function injectAdsAndAnalytics(html) {
  const analytics = `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

  const adTop = `<div class="ads"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.top}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
  const adMiddle = `<div class="ads"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.middle}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
  const adBottom = `<div class="ads"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.bottom}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;
  const adFluid = `<div class="ads"><ins class="adsbygoogle" style="display:block" data-ad-format="fluid" data-ad-layout-key="-fw+7+28-5k+1k" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOTS.fluid}"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>`;

  let newHtml = html.replace('</head>', `${analytics}</head>`);
  newHtml = newHtml.replace('<p>', `<p>${adTop}`);
  newHtml = newHtml.replace('</h2>', `</h2>${adMiddle}`);
  newHtml = newHtml.replace('</article>', `${adBottom}${adFluid}</article>`);
  return newHtml;
}

// ========== MONEY PAGES FROM CSV (with sitemap update) ==========
async function generateMoneyPages(repoPath, repoName) {
  const csvPath = path.join(__dirname, '..', 'money-keywords.csv');
  if (!fs.existsSync(csvPath)) return;
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.trim().split('\n').slice(1);
  for (const line of lines) {
    const [keyword, affiliateLink, productName] = line.split(',');
    if (!keyword || !affiliateLink) continue;
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const moneyPagePath = path.join(repoPath, `${slug}.html`);
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Buy ${productName || keyword} – Best Price</title>
<meta name="description" content="Get the best ${keyword} at the lowest price. Limited offer!">
<link rel="canonical" href="https://${repoName}.startknowledge.in/${slug}.html">
<meta property="og:title" content="${productName || keyword} - Buy Now">
<meta property="og:description" content="Best deal on ${keyword}. Click to buy.">
</head>
<body>
<h1>${productName || keyword}</h1>
<p><strong>Limited time offer!</strong></p>
<p><a href="${affiliateLink}" rel="sponsored nofollow" class="buy-button">Click here to buy now →</a></p>
<p>Trusted by thousands. Secure checkout.</p>
</body>
</html>`;
    fs.writeFileSync(moneyPagePath, injectAdsAndAnalytics(html));
    console.log(`💰 Money page generated: ${moneyPagePath}`);
    // Also update sitemap for this money page
    const fullMoneyUrl = `https://${repoName}.startknowledge.in/${slug}.html`;
    updateSitemap(repoPath, repoName, fullMoneyUrl, new Date().toISOString());
  }
}

// ========== AUTO 404 DETECTOR + FIXER ==========
async function fixBrokenLinks(repoPath, repoName) {
  const allHtmlFiles = [];
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
      else if (file.endsWith('.html')) allHtmlFiles.push(fullPath);
    }
  }
  walk(repoPath);

  const brokenLinks = [];
  for (const file of allHtmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]+)"/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      let href = match[1];
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('/')) continue;
      const targetPath = path.join(path.dirname(file), href);
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push({ file, href, targetPath });
      }
    }
  }

  for (const broken of brokenLinks) {
    let content = fs.readFileSync(broken.file, 'utf8');
    content = content.replace(new RegExp(`href="${broken.href}"`, 'g'), 'href="/"');
    fs.writeFileSync(broken.file, content);
    console.log(`🔧 Fixed broken link in ${broken.file}: ${broken.href} → /`);
    const pageUrl = `https://${repoName}.startknowledge.in/${path.basename(broken.file)}`;
    await submitToGoogleIndexing(pageUrl);
  }
}

async function submitToGoogleIndexing(url) {
  console.log(`📢 Index request sent (simulated): ${url}`);
}

// ========== HELPER FUNCTIONS ==========
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

// ========== ENHANCED KEYWORD FETCHING ==========
const MOTIONIX_KEYWORDS = [ /* keep as before – too long but unchanged */ ];

async function getTrendingKeywords(seed, repoName) {
  if (repoName === 'ultra-static-seo-engine') {
    return ['AI content generation', 'programmatic SEO best practices', 'Google Indexing API tutorial', 'semantic SEO strategies 2026', 'E-E-A-T signals for ranking', 'multi-language SEO automation'];
  }
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(seed)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const feed = await parser.parseURL(url);
    const keywords = [];
    for (const item of feed.items) {
      let title = item.title;
      title = title.replace(/\s*[–—-]\s*.*$/, '').replace(/\s*\|\s*.*$/, '').trim();
      if (title.length > 10 && !keywords.includes(title)) keywords.push(title);
      if (keywords.length >= 6) break;
    }
    if (keywords.length === 0) throw new Error('No news');
    return keywords;
  } catch (e) {
    console.warn(`⚠️ Google News RSS failed for "${seed}", using fallback keywords.`);
    const trendsUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN`;
    try {
      const trendsFeed = await parser.parseURL(trendsUrl);
      const keywords = [];
      for (const item of trendsFeed.items) {
        let title = item.title;
        title = title.replace(/\s*[–—-]\s*.*$/, '').replace(/\s*\|\s*.*$/, '').trim();
        if (title.length > 10 && !keywords.includes(title)) keywords.push(title);
        if (keywords.length >= 6) break;
      }
      if (keywords.length > 0) return keywords;
    } catch (trendsErr) { console.warn(`⚠️ India Trends RSS also failed.`); }
    if (repoName.toLowerCase() === 'motionix') {
      console.log(`🎨 Using Motionix‑specific keyword set (${MOTIONIX_KEYWORDS.length} options).`);
      const shuffled = [...MOTIONIX_KEYWORDS];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, 6);
    }
    const fallback = [
      `${seed} strategies`, `best ${seed} tools`, `how to ${seed}`,
      `${seed} for beginners`, `advanced ${seed}`, `${seed} trends ${new Date().getFullYear()}`
    ];
    return fallback;
  }
}

function generateSchema(keyword, repoName, slug, imageUrl, date) { /* unchanged */ }
function updateSitemap(repoPath, repoName, newUrl, lastmod) { /* unchanged */ }
function generateNavLinks() { /* unchanged */ }
function generateFooterLinks() { /* unchanged */ }
function generateRichStaticPage(page, repoName) { /* unchanged – very long, keep your existing */ }
function ensureStaticPages(repoPath, repoName) { /* unchanged */ }
async function generateStaticBlogIndex(repoPath, repoName) { /* unchanged – long, keep your existing */ }
function escapeXml(str) { /* unchanged */ }
async function generateRssFeed(repoPath, repoName, posts) { /* unchanged */ }
function escapeHtml(str) { /* unchanged */ }

// ========== PROCESS SINGLE REPO ==========
async function processRepo(repo) {
  console.log(`\n--- Processing ${repo.name} ---`);
  const repoPath = await prepareRepo(repo.name, repo.url);
  const blogDir = path.join(repoPath, 'blog');
  fs.ensureDirSync(blogDir);
  fs.ensureDirSync(path.join(repoPath, 'images'));
  ensureStaticPages(repoPath, repo.name);
  
  // Rotate money pages based on repo niche
  await rotateMoneyPages(repo.name);
  await generateMoneyPages(repoPath, repo.name);

  const seed = repo.name.replace(/-/g, ' ');
  let keywords;
  try {
    keywords = await getTrendingKeywords(seed, repo.name);
  } catch (err) {
    console.error(`❌ Skipping ${repo.name} - no keywords`);
    return;
  }
  console.log(`📈 Keywords:`, keywords);

  const allBlogsData = keywords.map(kw => ({
    title: kw,
    url: `/${kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100)}.html`
  }));

  const blogs = [];
  for (const kw of keywords) {
    const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
    const blogPath = path.join(blogDir, `${slug}.html`);
    let content;
    if (repo.lowPriority) {
      content = `<p>Complete guide to ${kw}. Learn actionable strategies to master ${kw} in 2026.</p>`;
    } else {
      content = await generateBlogContent(kw, repo.name, allBlogsData, blogPath, false);
      if (!content) continue;
    }
    const imageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/1200/630`;
    const publishDate = new Date().toISOString().split('T')[0];
    const schema = generateSchema(kw, repo.name, slug, imageUrl, publishDate);
    const metaDesc = `Complete guide to ${kw}. Learn actionable strategies, avoid common mistakes, and master ${kw} in 2026.`;
    let html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${kw} | ${repo.name}</title>
<meta name="description" content="${metaDesc}">
<link rel="canonical" href="https://${repo.name}.startknowledge.in/blog/${slug}.html">
<meta property="og:title" content="${kw} | ${repo.name}">
<meta property="og:image" content="${imageUrl}">
${schema}
<style>/* advanced CSS */</style>
</head>
<body>
<div class="container">
<article><img src="${imageUrl}" alt="${kw}" style="width:100%">${content}</article>
<footer><p>© ${new Date().getFullYear()} ${repo.name} | <a href="/">Home</a> | <a href="index.html">Blog Index</a></p></footer>
</div>
</body>
</html>`;
    html = injectAdsAndAnalytics(html);
    fs.writeFileSync(blogPath, html);
    const fullUrl = `https://${repo.name}.startknowledge.in/blog/${slug}.html`;
    updateSitemap(repoPath, repo.name, fullUrl, new Date().toISOString());
    blogs.push({ title: kw, url: `${slug}.html`, image: imageUrl, excerpt: metaDesc.substring(0, 120), date: publishDate });
    await delay(2000);
  }

  const posts = await generateStaticBlogIndex(repoPath, repo.name);
  await generateRssFeed(repoPath, repo.name, posts);
  await fixBrokenLinks(repoPath, repo.name);

  const git = simpleGit(repoPath);
  await git.addConfig('user.name', 'seo-bot', false, 'local');
  await git.addConfig('user.email', 'bot@seo.com', false, 'local');
  await git.add('.');
  const status = await git.status();
  if (status.files.length > 0) {
    await git.commit('🤖 Auto-generate SEO blogs + money pages + ads + 404 fix + RSS');
    const branchSummary = await git.branch();
    await git.push('origin', branchSummary.current);
    console.log(`✅ Pushed updates to ${repo.name}`);
  } else {
    console.log(`📭 No changes to commit for ${repo.name}`);
  }
  console.log(`✅ Completed ${repo.name} | ${blogs.length} blogs`);
}

// ========== MAIN ==========
async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable not set');
    process.exit(1);
  }
  fs.ensureDirSync(TEMP_DIR);
  for (const repo of REPOS_WITH_URL) await processRepo(repo);
  console.log('🔥 SYSTEM COMPLETE');
}

main().catch(console.error);