import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import { sanitizeSlug, cleanMarkdown, generateImage } from './utils.js';
import { generateAIContent } from './strategy-engine.js';

async function generateBlogPost(keyword, repoName, domain, strategy) {
  const prompt = `Write a detailed, SEO-optimized blog post about "${keyword}" for a website about ${strategy.niche}. Use headings (h2, h3), paragraphs, and a conclusion. Minimum 800 words. Return plain HTML without markdown or backticks.`;
  let content = await generateAIContent(prompt);
  content = cleanMarkdown(content);
  if (!content || content.length < CONFIG.MIN_CONTENT_LENGTH) {
    content = `<p>AI content unavailable for "${keyword}".</p>`;
  }
  return content;
}

function generateFAQ(repoName, niche) {
  const faqs = [
    { q: `What is ${repoName}?`, a: `${repoName} is a comprehensive platform dedicated to ${niche}, providing expert insights, tools, and resources.` },
    { q: `How can I get started with ${repoName}?`, a: `Simply explore our blog posts and tools. All content is free and updated regularly.` },
    { q: `Is the information on ${repoName} free?`, a: `Yes, 100% free. No registration required.` },
    { q: `How often is new content added?`, a: `New blog posts and resources are added automatically every few hours.` },
    { q: `Can I contribute or suggest a topic?`, a: `Absolutely! Contact us via the contact page.` },
    { q: `Does ${repoName} have a mobile app?`, a: `Not yet, but the website is fully responsive on all devices.` },
    { q: `How do I report an issue?`, a: `Use the contact form or email us directly.` },
    { q: `Are the tools on ${repoName} reliable?`, a: `Yes, we use up‑to‑date algorithms and data sources.` },
    { q: `Can I use content from ${repoName} for my own site?`, a: `Please see our terms of service. Short excerpts with attribution are allowed.` },
    { q: `How can I stay updated?`, a: `Subscribe to our RSS feed or check the blog regularly.` },
  ];
  return faqs.map(f => `<div class="faq-item"><h3>${f.q}</h3><p>${f.a}</p></div>`).join('');
}

function injectAds(html, contentLength) {
  let adCount = contentLength > 8000 ? 4 : contentLength > 4000 ? 3 : 2;
  const allScripts = `
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CONFIG.ADSENSE_CLIENT}" crossorigin="anonymous"></script>
    ${CONFIG.PROPELLER_SCRIPT}
    ${CONFIG.ADSTERRA_SCRIPT}
    ${CONFIG.MEDIANET_SCRIPT}
  `;
  html = html.replace('</head>', `${allScripts}</head>`);
  const parts = html.split('</p>');
  const step = Math.max(1, Math.floor(parts.length / adCount));
  let newHtml = '';
  for (let i = 0; i < parts.length; i++) {
    newHtml += parts[i] + '</p>';
    if (i > 0 && i % step === 0 && i < parts.length - 1) {
      const slot = CONFIG.ADSENSE_SLOTS[Math.floor(Math.random() * CONFIG.ADSENSE_SLOTS.length)];
      newHtml += `<ins class="adsbygoogle" style="display:block" data-ad-format="fluid" data-ad-client="${CONFIG.ADSENSE_CLIENT}" data-ad-slot="${slot}"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;
    }
  }
  return newHtml;
}

function buildNav(repoName) {
  return `<nav>
    <a href="/${repoName}/">Home</a> |
    <a href="/${repoName}/blog/">Blog</a> |
    <a href="/${repoName}/pages/about.html">About</a> |
    <a href="/${repoName}/pages/contact.html">Contact</a> |
    <a href="/${repoName}/pages/privacy.html">Privacy</a> |
    <a href="/${repoName}/pages/faq.html">FAQ</a> |
    <a href="/${repoName}/pages/disclaimer.html">Disclaimer</a> |
    <a href="/${repoName}/pages/terms.html">Terms</a>
  </nav>`;
}

function buildFooter(repoName) {
  return `<footer>
  <p>&copy; ${new Date().getFullYear()} ${repoName} | 
  <a href="/${repoName}/pages/privacy.html">Privacy</a> | 
  <a href="/${repoName}/pages/faq.html">FAQ</a> | 
  <a href="/${repoName}/pages/disclaimer.html">Disclaimer</a> | 
  <a href="/${repoName}/pages/terms.html">Terms</a>
  </p></footer>`;
}

async function generateStaticPages(repoName, domain, niche) {
  const pagesDir = `./docs/${repoName}/pages`;
  if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

  const faqContent = generateFAQ(repoName, niche);
  const pages = [
    { slug: 'about', title: 'About Us', content: `<p>${repoName} is your trusted source for ${niche}. Our mission is to provide accurate, up‑to‑date information and tools.</p>` },
    { slug: 'contact', title: 'Contact', content: `<p>Email: contact@${repoName}.com</p><p>Phone: +91-XXXXXXXXXX</p>` },
    { slug: 'privacy', title: 'Privacy Policy', content: `<p>We respect your privacy. This site uses cookies and third‑party ads.</p>` },
    { slug: 'faq', title: 'Frequently Asked Questions', content: faqContent },
    { slug: 'disclaimer', title: 'Disclaimer', content: `<p>The information provided is for general informational purposes only. We are not liable for any errors or omissions.</p>` },
    { slug: 'terms', title: 'Terms of Service', content: `<p>By using this site, you agree to these terms. All content is property of ${repoName}.</p>` },
  ];

  const nav = buildNav(repoName);
  const footer = buildFooter(repoName);
  const styleLink = `<link rel="stylesheet" href="/${repoName}/style.css">`;

  for (const page of pages) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page.title} | ${repoName}</title><meta name="description" content="${page.title} page for ${repoName}">${styleLink}</head>
<body><header>${nav}</header><main><h1>${page.title}</h1>${page.content}</main>${footer}</body>
</html>`;
    fs.writeFileSync(`${pagesDir}/${page.slug}.html`, html);
  }
  return pages.map(p => ({ slug: p.slug, url: `${domain}/pages/${p.slug}.html`, date: new Date().toISOString() }));
}

export async function generateContentForRepo(repoName, domain, strategy) {
  console.log(`📝 Generating content for ${repoName}`);
  const blogDir = `./docs/${repoName}/blog`;
  const pagesDir = `./docs/${repoName}/pages`;
  const imgDir = `./docs/${repoName}/blog/images`;
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
  if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  const blogs = [];
  const nav = buildNav(repoName);
  const footer = buildFooter(repoName);
  const styleLink = `<link rel="stylesheet" href="/${repoName}/style.css">`;

  for (const keyword of strategy.cluster) {
    const slug = sanitizeSlug(keyword);
    const url = `${domain}/blog/${slug}.html`;
    const imageFilename = `${slug}.jpg`;
    const imagePath = `${imgDir}/${imageFilename}`;
    const imageUrl = `/blog/images/${imageFilename}`;

    // Generate blog content
    let body = await generateBlogPost(keyword, repoName, domain, strategy);
    body = injectAds(body, body.length);

    // Generate image based on keyword
    console.log(`🖼️ Generating image for: ${keyword}`);
    await generateImage(keyword, imagePath);

    // Build HTML with image at the top
    const imageHtml = `<img src="${imageUrl}" alt="${keyword}" class="featured-image" style="width:100%; max-width:800px; margin:1rem auto; display:block; border-radius:12px;">`;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${keyword}</title><meta name="description" content="Complete guide about ${keyword}"><link rel="canonical" href="${url}">${styleLink}</head>
<body><header>${nav}</header><main>${imageHtml}${body}</main>${footer}</body>
</html>`;
    fs.writeFileSync(`${blogDir}/${slug}.html`, fullHtml);
    blogs.push({ slug, keyword, url, date: new Date().toISOString() });
    console.log(`✅ Blog: ${url} (with image)`);
  }

  const pages = await generateStaticPages(repoName, domain, strategy.niche);
  return { blogs, pages };
}