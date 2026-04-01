import fs from 'fs';
import { CONFIG } from '../config.js';
import { sanitizeSlug, retry } from './utils.js';
import { generateAIContent } from './strategy-engine.js';   // reuse the AI call

// Generate a full blog post using AI
async function generateBlogPost(keyword, repoName, domain) {
  const prompt = `Write a detailed, SEO-optimized blog post about "${keyword}". Use headings (h2, h3), paragraphs, and a conclusion. The content should be informative, engaging, and at least 800 words. Return only the HTML body content (no <html>, <head>).`;

  let content = await retry(() => generateAIContent(prompt));
  if (!content || content.length < CONFIG.MIN_CONTENT_LENGTH) {
    content = `<p>No AI content generated for "${keyword}".</p>`;
  }

  return content;
}

// Generate static pages (about, contact, privacy)
function generateStaticPage(title, content) {
  return `
    <h1>${title}</h1>
    <div class="page-content">
      ${content}
    </div>
  `;
}

// Inject ads into HTML body (intelligent placement)
function injectAds(html, contentLength) {
  // Choose ad frequency based on content length
  let adCount = 2;
  if (contentLength > 8000) adCount = 4;
  else if (contentLength > 4000) adCount = 3;

  // Scripts to add in <head>
  const allScripts = `
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CONFIG.ADSENSE_CLIENT}" crossorigin="anonymous"></script>
    ${CONFIG.PROPELLER_SCRIPT}
    ${CONFIG.ADSTERRA_SCRIPT}
    ${CONFIG.MEDIANET_SCRIPT}
  `;
  html = html.replace('</head>', `${allScripts}</head>`);

  // Insert AdSense blocks after every ~nth paragraph
  const paragraphs = html.split('</p>');
  const step = Math.max(1, Math.floor(paragraphs.length / adCount));
  let newHtml = '';
  for (let i = 0; i < paragraphs.length; i++) {
    newHtml += paragraphs[i] + '</p>';
    if (i > 0 && i % step === 0 && i < paragraphs.length - 1) {
      const slot = CONFIG.ADSENSE_SLOTS[Math.floor(Math.random() * CONFIG.ADSENSE_SLOTS.length)];
      newHtml += `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-format="fluid"
             data-ad-client="${CONFIG.ADSENSE_CLIENT}"
             data-ad-slot="${slot}"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      `;
    }
  }

  // Also add one at the end
  newHtml += `
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-format="fluid"
         data-ad-client="${CONFIG.ADSENSE_CLIENT}"
         data-ad-slot="${CONFIG.ADSENSE_SLOTS[0]}"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  `;

  return newHtml;
}

// Main entry: generate all content for a repo
export async function generateContentForRepo(repoName, domain, strategy) {
  console.log(`📝 Generating content for ${repoName} (${domain})`);

  const docsDir = `./docs/${repoName}`;
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const blogs = [];
  const pages = [];

  // --- Generate blogs (using keywords from strategy)
  for (const keyword of strategy.cluster) {
    const slug = sanitizeSlug(keyword);
    const url = `${domain}/${slug}.html`;
    const date = new Date().toISOString();

    let bodyContent = await generateBlogPost(keyword, repoName, domain);
    bodyContent = injectAds(bodyContent, bodyContent.length);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${keyword}</title>
  <meta name="description" content="Complete guide about ${keyword}">
  <meta name="keywords" content="${keyword}, ${strategy.niche}, ${repoName}">
  <link rel="canonical" href="${url}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${keyword}">
  <meta property="og:description" content="Complete guide about ${keyword}">
  <meta property="og:image" content="https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${keyword}">
  <meta name="twitter:description" content="Complete guide about ${keyword}">
  <meta name="twitter:image" content="https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}">
  
  <link rel="stylesheet" href="/${repoName}/style.css">
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${keyword}",
  "url": "${url}",
  "datePublished": "${new Date().toISOString()}",
  "description": "Complete guide about ${keyword}",
  "author": {
    "@type": "Organization",
    "name": "${repoName}"
  }
}
</script>
</head>
<body>
  <header>
    <nav><a href="/${repoName}/">Home</a> | <a href="/${repoName}/about.html">About</a> | <a href="/${repoName}/contact.html">Contact</a> | <a href="/${repoName}/privacy.html">Privacy</a></nav>
  </header>
  <main>
    ${bodyContent}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${repoName} - All rights reserved.</p>
  </footer>
</body>
</html>`;

    const filePath = `${docsDir}/${slug}.html`;
    fs.writeFileSync(filePath, fullHtml);
    console.log(`✅ Blog: ${url}`);

    blogs.push({ slug, keyword, url, date });
  }

  // --- Generate static pages (about, contact, privacy)
  const staticPages = [
  { slug: 'about', title: 'About Us', content: `<p>This site is dedicated to ${repoName}. We provide the latest information and insights.</p>` },
  { slug: 'contact', title: 'Contact', content: `<p>Email: contact@${repoName}.com</p><p>Phone: 18001803246</p>` },
  { slug: 'privacy', title: 'Privacy Policy', content: `<p>We respect your privacy. This site uses cookies and third-party ads.</p>` },
  { slug: 'faq', title: 'FAQ', content: `<p><strong>Q: What is ${repoName}?</strong><br>A: ${repoName} is a site dedicated to providing helpful information on related topics.</p><p><strong>Q: How often is content updated?</strong><br>A: New content is generated automatically every few hours.</p>` },
  { slug: 'disclaimer', title: 'Disclaimer', content: `<p>The information provided on this site is for general informational purposes only. We are not liable for any errors or omissions.</p>` },
  { slug: 'terms', title: 'Terms of Service', content: `<p>By using this site, you agree to these terms. All content is property of ${repoName} and may not be reproduced without permission.</p>` },
];

  for (const page of staticPages) {
    const bodyContent = generateStaticPage(page.title, page.content);
    const url = `${domain}/${page.slug}.html`;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | ${repoName}</title>
  <link rel="canonical" href="${url}">
  <link rel="stylesheet" href="/${repoName}/style.css">
</head>
<body>
  <header>
  <nav>
  <a href="/${repoName}/">Home</a> | 
  <a href="/${repoName}/about.html">About</a> | 
  <a href="/${repoName}/contact.html">Contact</a>
  </nav>
  </header>
  <main>${bodyContent}</main>
  <footer>
  <nav>
  <a href="/${repoName}/privacy.html">Privacy</a>|
  <a href="/${repoName}/faq.html">FAQ</a>|
  <a href="/${repoName}/disclaimer.html">Disclaimer</a>|
  <a href="/${repoName}/terms.html">Terms</a>
  </nav>
  <p>&copy; ${new Date().getFullYear()} ${repoName}</p>
  </footer>
</body>
</html>`;
    fs.writeFileSync(`${docsDir}/${page.slug}.html`, fullHtml);
    pages.push({ slug: page.slug, url, date: new Date().toISOString() });
  }

  return { blogs, pages };
}