// engine/core.js - Complete SEO automation with money pages, ads, 404 fix, offline AI
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

// Repositories (add lowPriority: true for those that should use only fallback)
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

const STATIC_PAGES = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'faq.html', 'disclaimer.html', 'cookies.html', 'support.html', 'documentation.html', 'changelog.html'];

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

// ========== HELPER: DELAY (rate limit safety) ==========
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

// ========== GENERATE BLOG CONTENT (with age check) ==========
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
- Real‑world examples
- Common mistakes and how to avoid them
- FAQ section (5 questions) with schema markup (Question/Answer)
- Conclusion with a strong call‑to‑action
Write naturally, use bold and italics where appropriate.`;

  let aiContent = await generateContentWithFallback(prompt, repoName);
  if (!aiContent) {
    aiContent = `<p>Complete guide to ${keyword}. Learn actionable strategies to master ${keyword} in 2026.</p>
<h2>Why ${keyword} matters</h2><p>Understanding ${keyword} is crucial for success.</p>
<h2>Key strategies</h2><ul><li>Research thoroughly</li><li>Implement step by step</li><li>Measure and optimize</li></ul>
<h2>FAQ</h2><p><strong>What is ${keyword}?</strong> It's a process to achieve goals.</p>`;
  }

  // Internal + cross-repo + external links (same as before)
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

  // Insert analytics into <head>
  let newHtml = html.replace('</head>', `${analytics}</head>`);
  // Insert ads after first <p>, after second <h2>, and before footer
  newHtml = newHtml.replace('<p>', `<p>${adTop}`);
  newHtml = newHtml.replace('</h2>', `</h2>${adMiddle}`);
  newHtml = newHtml.replace('</article>', `${adBottom}${adFluid}</article>`);
  return newHtml;
}

// ========== MONEY PAGES FROM CSV ==========
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
  }
}

// ========== AUTO 404 DETECTOR + FIXER + INDEX REQUEST ==========
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
      if (href.startsWith('http') || href.startsWith('#')) continue;
      const targetPath = path.join(repoPath, href);
      if (!fs.existsSync(targetPath)) {
        brokenLinks.push({ file, href, targetPath });
      }
    }
  }

  // Fix broken links: remove or redirect to home
  for (const broken of brokenLinks) {
    let content = fs.readFileSync(broken.file, 'utf8');
    content = content.replace(new RegExp(`href="${broken.href}"`, 'g'), 'href="/"');
    fs.writeFileSync(broken.file, content);
    console.log(`🔧 Fixed broken link in ${broken.file}: ${broken.href} → /`);

    // Request Google Indexing API for fixed page (optional)
    const pageUrl = `https://${repoName}.startknowledge.in/${path.basename(broken.file)}`;
    await submitToGoogleIndexing(pageUrl);
  }
}

async function submitToGoogleIndexing(url) {
  // Placeholder – requires service account. For now just log.
  console.log(`📢 Index request sent (simulated): ${url}`);
  // Real implementation would use google-auth-library and Indexing API.
}

// ========== OTHER HELPER FUNCTIONS ==========
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
    console.error(`❌ No keywords for ${seed}`);
    throw new Error(`No keywords`);
  }
}

function generateSchema(keyword, repoName, slug, imageUrl, date) {
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${keyword.replace(/"/g, '\\"')}",
  "description": "Complete guide to ${keyword.replace(/"/g, '\\"')}.",
  "author": {"@type": "Organization", "name": "${repoName}"},
  "datePublished": "${date}",
  "dateModified": "${new Date().toISOString()}",
  "image": "${imageUrl}"
}
</script>`;
}

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
function generateNavLinks() {
  let links = `<li><a href="/">Home</a></li><li><a href="blog/index.html">Blog</a></li>`;
  for (const page of STATIC_PAGES) {
    const name = page.replace('.html', '');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    links += `<li><a href="/${page}">${displayName}</a></li>`;
  }
  return links;
}

// ========== GENERATE FOOTER LINKS ==========
function generateFooterLinks() {
  let links = `<a href="/">Home</a><a href="blog/index.html">Blog</a>`;
  for (const page of STATIC_PAGES) {
    const name = page.replace('.html', '');
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    links += `<a href="/${page}">${displayName}</a>`;
  }
  return links;
}

// ========== GENERATE RICH STATIC PAGE (modern, full navigation, repo‑specific content) ==========
function generateRichStaticPage(page, repoName) {
  const pageName = page.replace('.html', '');
  const displayTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  const description = `${displayTitle} page of ${repoName} – learn more about our services, policies, and information.`;
  const canonicalUrl = `https://${repoName}.startknowledge.in/${page}`;
  const imageUrl = `https://source.unsplash.com/800x400/?${encodeURIComponent(displayTitle)}`;
  const currentDate = new Date().toISOString().split('T')[0];

  // Generate meaningful content based on page type and repo name
  let contentHtml = '';
  switch (pageName) {
    case 'about':
      contentHtml = `<p>${repoName} is a cutting‑edge platform powered by an advanced AI SEO automation engine. We generate high‑quality content, programmatic pages, and automated tools to help you scale your online presence.</p>
<p>Our mission is to make SEO accessible and efficient through automation, leveraging the latest AI models and Google Trends data.</p>
<p>We believe in transparent, data‑driven strategies that deliver real results. Our team is dedicated to continuous improvement and innovation.</p>`;
      break;
    case 'contact':
      contentHtml = `<p>You can reach us via email at <a href="mailto:contact@${repoName}.startknowledge.in">contact@${repoName}.startknowledge.in</a>.</p>
<p>For business inquiries, partnership opportunities, or technical support, please use the contact form (coming soon). We aim to respond within 24 hours.</p>`;
      break;
    case 'privacy':
      contentHtml = `<p>We respect your privacy. This website does not collect personal data unless explicitly provided by you. Any data collected is used solely for improving our services.</p>
<p>We use cookies to enhance user experience. You can disable cookies in your browser settings.</p>
<p>For any privacy concerns, please contact us at the email above.</p>`;
      break;
    case 'terms':
      contentHtml = `<p>By using this website, you agree to our terms of service. All content is for informational purposes only. We are not liable for any damages resulting from the use of this site.</p>
<p>You may not reproduce, distribute, or exploit any content without prior written consent.</p>`;
      break;
    case 'faq':
      contentHtml = `<p><strong>Q: How often is content updated?</strong><br>A: New blog posts are generated automatically every few hours based on Google Trends.</p>
<p><strong>Q: Can I contribute?</strong><br>A: Currently, all content is AI‑generated. For suggestions, please contact us.</p>
<p><strong>Q: Are the tools free?</strong><br>A: Yes, all calculators and tools on ${repoName} are completely free to use.</p>`;
      break;
    case 'disclaimer':
      contentHtml = `<p>The information provided on this website is for general informational purposes only. We make no representations or warranties of any kind about the completeness, accuracy, reliability, or suitability of the information.</p>
<p>Any reliance you place on such information is strictly at your own risk.</p>`;
      break;
    case 'cookies':
      contentHtml = `<p>This site uses cookies to improve your experience. By continuing to browse, you agree to our use of cookies.</p>
<p>Cookies are small text files stored on your device. They help us understand how visitors interact with our site.</p>`;
      break;
    case 'support':
      contentHtml = `<p>For technical support, please email <a href="mailto:support@${repoName}.startknowledge.in">support@${repoName}.startknowledge.in</a>. We aim to respond within 24 hours.</p>
<p>You can also refer to our <a href="/documentation.html">documentation</a> for common issues.</p>`;
      break;
    case 'documentation':
      contentHtml = `<p>Our automation system is built on Node.js and uses Groq AI, Google News RSS, and GitHub Actions. For developer documentation, please refer to the project repository.</p>
<p>Key components: blog generation, sitemap updates, static page creation, multi‑AI fallback, and money pages.</p>`;
      break;
    case 'changelog':
      contentHtml = `<p><strong>Latest updates:</strong></p>
<ul>
<li>April 2026: Added multi‑language support (EN, ES, DE, FR, HI).</li>
<li>March 2026: Introduced auto money pages and comparison tables.</li>
<li>February 2026: Improved AI fallback with Ollama support.</li>
</ul>`;
      break;
    default:
      contentHtml = `<p>This page provides information about ${displayTitle} for ${repoName}. Please check back for updates.</p>`;
  }

  const navLinks = generateNavLinks();
  const footerLinks = generateFooterLinks();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${displayTitle} | ${repoName}</title>
  <meta name="description" content="${description}">
  <meta name="keywords" content="${displayTitle.toLowerCase()}, ${repoName}, information, policies">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="googlebot" content="index, follow">
  <meta http-equiv="content-language" content="en-IN">
  <meta name="geo.region" content="IN">
  <meta name="theme-color" content="#6c5ce7">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${displayTitle} | ${repoName}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${displayTitle} | ${repoName}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "${canonicalUrl}#webpage",
        "url": "${canonicalUrl}",
        "name": "${displayTitle}",
        "description": "${description}",
        "inLanguage": "en-IN",
        "publisher": {
          "@type": "Organization",
          "name": "${repoName}",
          "url": "https://${repoName}.startknowledge.in"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "${canonicalUrl}#breadcrumb",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": { "@id": "https://${repoName}.startknowledge.in/" } },
          { "@type": "ListItem", "position": 2, "name": "${displayTitle}", "item": { "@id": "${canonicalUrl}" } }
        ]
      }
    ]
  }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    /* Modern CSS – same as blog index */
    :root {
      --primary: #6c5ce7;
      --primary-dark: #5a4bcf;
      --secondary: #00cec9;
      --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --glass-bg: rgba(255, 255, 255, 0.9);
      --glass-border: rgba(255, 255, 255, 0.3);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: var(--glass-bg);
      backdrop-filter: blur(8px);
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 0 25px 45px -12px rgba(0,0,0,0.2);
      border: 1px solid var(--glass-border);
    }
    .nav-links {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      list-style: none;
      padding: 20px 32px;
      background: rgba(255,255,255,0.7);
      border-bottom: 1px solid rgba(108,92,231,0.2);
    }
    .nav-links a {
      text-decoration: none;
      font-weight: 500;
      color: #334155;
      transition: 0.3s;
    }
    .nav-links a:hover { color: var(--primary); }
    main { padding: 40px; }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: var(--gradient-1);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
    img {
      max-width: 100%;
      border-radius: 20px;
      margin: 20px 0;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
    p { margin-bottom: 1.2rem; color: #475569; }
    a { color: var(--primary); text-decoration: none; border-bottom: 1px solid transparent; transition: 0.2s; }
    a:hover { border-bottom-color: var(--primary); }
    .footer-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      padding: 20px;
      background: #f1f5f9;
      border-top: 1px solid #e2e8f0;
    }
    .footer-links a { color: #64748b; font-size: 0.9rem; border-bottom: none; }
    .footer-links a:hover { color: var(--primary); }
    footer p { text-align: center; padding: 20px; margin: 0; color: #64748b; }
    @media (max-width: 700px) { main { padding: 20px; } h1 { font-size: 1.8rem; } .nav-links { justify-content: center; } }
  </style>
</head>
<body>
<div class="container">
  <ul class="nav-links">
    ${navLinks}
  </ul>
  <main>
    <h1>${displayTitle}</h1>
    <img src="${imageUrl}" alt="${displayTitle}" loading="lazy">
    ${contentHtml}
  </main>
  <div class="footer-links">
    ${footerLinks}
  </div>
  <footer>
    <p>© ${new Date().getFullYear()} ${repoName} | <a href="/">Home</a> | <a href="blog/index.html">Blog</a></p>
  </footer>
</div>
</body>
</html>`;
}

// ========== ENSURE STATIC PAGES (overwrites minimal versions) ==========
function ensureStaticPages(repoPath, repoName) {
  STATIC_PAGES.forEach(page => {
    const pagePath = path.join(repoPath, page);
    // Always generate rich version (overwrites old minimal pages)
    const richHtml = generateRichStaticPage(page, repoName);
    fs.writeFileSync(pagePath, injectAdsAndAnalytics(richHtml));
    console.log(`📄 Generated/Updated rich static page: ${pagePath}`);
  });
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
  const newNavLinks = generateNavLinks();
  // Replace the nav-links ul content
  const navRegex = /(<ul class="nav-links">)([\s\S]*?)(<\/ul>)/;
  if (navRegex.test(indexContent)) {
    indexContent = indexContent.replace(navRegex, `$1${newNavLinks}$3`);
    fs.writeFileSync(indexPath, injectAdsAndAnalytics(indexContent));
    console.log(`🔄 Updated navigation links in ${indexPath}`);
  } else {
    console.warn(`⚠️ Could not find nav-links ul in ${indexPath}`);
  }
}

// ========== PROCESS SINGLE REPO ==========
async function processRepo(repo) {
  console.log(`\n--- Processing ${repo.name} ---`);
  const repoPath = await prepareRepo(repo.name, repo.url);
  const blogDir = path.join(repoPath, 'blog');
  fs.ensureDirSync(blogDir);
  fs.ensureDirSync(path.join(repoPath, 'images'));
  ensureStaticPages(repoPath, repo.name);
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
<style>/* advanced CSS (same as before) */</style>
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

  if (blogs.length) {
    await updatePostsJsonAndIndex(repoPath, repo.name, blogs);
    await fixBrokenLinks(repoPath, repo.name); // auto detect & fix 404s
    const git = simpleGit(repoPath);
    await git.addConfig('user.name', 'seo-bot', false, 'local');
    await git.addConfig('user.email', 'bot@seo.com', false, 'local');
    await git.add('.');
    const status = await git.status();
    if (status.files.length > 0) {
      await git.commit('🤖 Auto-generate SEO blogs + money pages + ads + 404 fix');
      const branchSummary = await git.branch();
      await git.push('origin', branchSummary.current);
      console.log(`✅ Pushed updates to ${repo.name}`);
    } else {
      console.log(`📭 No changes to commit for ${repo.name}`);
    }
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