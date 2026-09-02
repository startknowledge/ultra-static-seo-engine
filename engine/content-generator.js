import fs from 'fs';
import path from 'path';

import { CONFIG } from '../config.js';

import {
  sanitizeSlug,
  cleanMarkdown,
  generateImage
} from './utils.js';

import {
  generateAIContent
} from './strategy-engine.js';

import {
  getTrendsForKeyword
} from './trends-widget.js';

function ensureDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function injectAds(
  html,
  contentLength
) {
  const client =
    CONFIG?.ADSENSE_CLIENT;

  const slots =
    Array.isArray(
      CONFIG?.ADSENSE_SLOTS
    )
      ? CONFIG.ADSENSE_SLOTS
      : [];

  if (
    !client ||
    slots.length === 0
  ) {
    return html;
  }

  const adCount =
    contentLength > 8000
      ? 4
      : contentLength > 4000
        ? 3
        : 2;

  const scripts = `
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}"
  crossorigin="anonymous">
</script>
`;

  if (
    html.includes('</head>')
  ) {
    html =
      html.replace(
        '</head>',
        `${scripts}</head>`
      );
  }

  const parts =
    html.split('</p>');

  const step =
    Math.max(
      1,
      Math.floor(
        parts.length / adCount
      )
    );

  let result = '';

  for (
    let i = 0;
    i < parts.length;
    i++
  ) {
    result +=
      parts[i] + '</p>';

    if (
      i > 0 &&
      i % step === 0 &&
      i < parts.length - 1
    ) {
      const slot =
        slots[
          Math.floor(
            Math.random() *
            slots.length
          )
        ];

      result += `
<ins
  class="adsbygoogle"
  style="display:block"
  data-ad-format="fluid"
  data-ad-client="${client}"
  data-ad-slot="${slot}">
</ins>

<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`;
    }
  }

  return result;
}

async function generateBlogPost(
  keyword,
  strategy
) {
  const prompt = `
Write a detailed, original and useful SEO article
about:

"${keyword}"

Website context:
${strategy?.niche || 'the website subject'}

Requirements:

- Minimum 1000 words.
- Use H2 and H3 headings.
- Use readable paragraphs.
- Include practical information.
- Explain the topic clearly.
- Include useful examples where appropriate.
- Include a conclusion.
- Avoid keyword stuffing.
- Do not invent statistics.
- Do not make unsupported claims.
- Do not mention AI.
- Return HTML only.
- Do not use markdown fences.
`;

  let content = '';

  try {
    content =
      await generateAIContent(
        prompt
      );
  } catch (error) {
    console.warn(
      `⚠️ AI generation failed for ${keyword}: ${error.message}`
    );
  }

  content =
    cleanMarkdown(
      content || ''
    );

  const minLength =
    Number(
      CONFIG?.MIN_CONTENT_LENGTH || 1200
    );

  if (
    !content ||
    content.length < minLength
  ) {
    content = `
<h2>What Is ${escapeHtml(keyword)}?</h2>

<p>
${escapeHtml(keyword)} is a topic that can
benefit from a clear and practical explanation.
Understanding its basic concepts helps readers
make better-informed decisions and find more
reliable information.
</p>

<h2>Important Points</h2>

<ul>

<li>
Understand the basic concepts related to
${escapeHtml(keyword)}.
</li>

<li>
Compare information from reliable sources.
</li>

<li>
Keep information updated as the subject changes.
</li>

<li>
Use practical examples whenever possible.
</li>

</ul>

<h2>How to Learn More</h2>

<p>
Start with the fundamentals, review trustworthy
resources and gradually explore more advanced
aspects of the subject.
</p>

<h2>Conclusion</h2>

<p>
A good understanding of ${escapeHtml(keyword)}
can help readers identify useful information
and make more informed decisions.
</p>
`;
  }

  return content;
}

async function generateSidebar(
  currentKeyword,
  blogs
) {
  let trendsHtml =
    '<p>Trend data unavailable.</p>';

  try {
    const trends =
      await getTrendsForKeyword(
        currentKeyword
      );

    if (
      Array.isArray(trends) &&
      trends.length
    ) {
      trendsHtml = `
<ul>
${trends
  .map(
    trend =>
      `<li>🔥 ${escapeHtml(trend)}</li>`
  )
  .join('')}
</ul>
`;
    }
  } catch {
    // Keep fallback.
  }

  const recent =
    blogs
      .slice(-5)
      .reverse()
      .map(
        blog => `
<li>
<a href="${escapeHtml(blog.url)}">
${escapeHtml(blog.keyword)}
</a>
</li>
`
      )
      .join('');

  return `
<aside class="sidebar">

<div class="widget">

<h3>📈 Google Trends</h3>

${trendsHtml}

</div>

<div class="widget">

<h3>📝 Recent Posts</h3>

<ul>
${
  recent ||
  '<li>No recent posts.</li>'
}
</ul>

</div>

</aside>
`;
}

function createBlogIndex(
  repoName,
  blogs
) {
  const cards =
    blogs
      .map(blog => {
        const slug =
          sanitizeSlug(
            blog.keyword
          );

        return `
<article class="blog-card">

<img
  src="/blog/images/${slug}.jpg"
  alt="${escapeHtml(blog.keyword)}"
  loading="lazy"
>

<div>

<h2>
${escapeHtml(blog.keyword)}
</h2>

<p>
Explore our latest information,
guides and analysis about
${escapeHtml(blog.keyword)}.
</p>

<a
  href="${escapeHtml(blog.url)}"
>
Read more →
</a>

</div>

</article>
`;
      })
      .join('');

  return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Blog | ${escapeHtml(repoName)}
</title>

<meta
  name="description"
  content="${escapeHtml(
    `Latest articles and guides from ${repoName}`
  )}"
>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  background: #f4f6f8;
  color: #222;
}

header {
  background: #111827;
  padding: 18px;
}

nav {
  max-width: 1100px;
  margin: auto;
}

nav a {
  color: white;
  text-decoration: none;
  margin-right: 20px;
}

.container {
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}

.blog-grid {
  display: grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(280px, 1fr)
    );
  gap: 25px;
}

.blog-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 18px
    rgba(0,0,0,.08);
}

.blog-card img {
  width: 100%;
  height: 190px;
  object-fit: cover;
}

.blog-card div {
  padding: 20px;
}

.blog-card a {
  text-decoration: none;
  font-weight: 700;
}

footer {
  margin-top: 50px;
  padding: 25px;
  background: #111827;
  color: white;
  text-align: center;
}

</style>

</head>

<body>

<header>

<nav>
<a href="/">Home</a>
<a href="/blog/">Blog</a>
</nav>

</header>

<main class="container">

<h1>Blog</h1>

<div class="blog-grid">

${
  cards ||
  '<p>No blog posts available.</p>'
}

</div>

</main>

<footer>
© ${new Date().getFullYear()}
${escapeHtml(repoName)}
</footer>

</body>

</html>`;
}

export async function generateContentForRepo(
  repoName,
  domain,
  strategy = {}
) {
  console.log(
    `📝 Generating blogs for ${repoName}`
  );

  const repoRoot =
    path.join(
      './docs',
      repoName
    );

  const blogDir =
    path.join(
      repoRoot,
      'blog'
    );

  const imageDir =
    path.join(
      blogDir,
      'images'
    );

  ensureDirectory(
    blogDir
  );

  ensureDirectory(
    imageDir
  );

  /*
   * IMPORTANT:
   *
   * No pages directory is created here.
   *
   * Existing static pages remain completely
   * outside this generator.
   */
  const blogs = [];

  const keywords =
    Array.isArray(
      strategy?.cluster
    )
      ? strategy.cluster
      : [];

  for (const keywordValue of keywords) {
    const keyword =
      String(
        keywordValue || ''
      ).trim();

    if (!keyword) {
      continue;
    }

    const slug =
      sanitizeSlug(keyword);

    if (!slug) {
      continue;
    }

    const filePath =
      path.join(
        blogDir,
        `${slug}.html`
      );

    /*
     * Never overwrite an existing blog.
     */
    if (fs.existsSync(filePath)) {
      console.log(
        `⏭️ Blog already exists: ${slug}`
      );

      continue;
    }

    const url =
      `${domain}/blog/${slug}.html`;

    const imageFilename =
      `${slug}.jpg`;

    const imagePath =
      path.join(
        imageDir,
        imageFilename
      );

    let body =
      await generateBlogPost(
        keyword,
        strategy
      );

    body =
      injectAds(
        body,
        body.length
      );

    try {
      await generateImage(
        keyword,
        imagePath
      );
    } catch (error) {
      console.warn(
        `⚠️ Image generation failed: ${error.message}`
      );
    }

    const sidebar =
      await generateSidebar(
        keyword,
        blogs
      );

    const generatedAt =
      new Date().toISOString();

    const html = `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
${escapeHtml(keyword)}
</title>

<meta
  name="description"
  content="${escapeHtml(
    `Complete guide about ${keyword}`
  )}"
>

<link
  rel="canonical"
  href="${escapeHtml(url)}"
>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  line-height: 1.7;
  background: #f4f6f8;
  color: #222;
}

header {
  background: #111827;
  padding: 18px;
}

nav {
  max-width: 1100px;
  margin: auto;
}

nav a {
  color: white;
  text-decoration: none;
  margin-right: 20px;
  font-weight: 600;
}

.container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

.main-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    300px;
  gap: 30px;
}

.content-area,
.sidebar .widget {
  background: white;
  border-radius: 12px;
  padding: 25px;
}

.featured-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 20px;
}

h1 {
  font-size: 42px;
  line-height: 1.2;
}

h2 {
  margin-top: 32px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar ul {
  padding-left: 20px;
}

.sidebar a {
  text-decoration: none;
}

footer {
  margin-top: 50px;
  background: #111827;
  color: white;
  padding: 25px;
  text-align: center;
}

@media (max-width: 800px) {

.main-grid {
  grid-template-columns: 1fr;
}

h1 {
  font-size: 32px;
}

}

</style>

</head>

<body>

<header>

<nav>
<a href="/">Home</a>
<a href="/blog/">Blog</a>
</nav>

</header>

<div class="container">

<div class="main-grid">

<main class="content-area">

<img
  class="featured-image"
  src="/blog/images/${imageFilename}"
  alt="${escapeHtml(keyword)}"
  loading="eager"
>

<h1>
${escapeHtml(keyword)}
</h1>

${body}

<p>
<small>
Published: ${generatedAt}
</small>
</p>

</main>

${sidebar}

</div>

</div>

<footer>
© ${new Date().getFullYear()}
${escapeHtml(repoName)}
</footer>

</body>

</html>`;

    fs.writeFileSync(
      filePath,
      html,
      'utf8'
    );

    blogs.push({
      slug,
      keyword,
      url,
      date: generatedAt
    });

    console.log(
      `✅ Blog created: ${url}`
    );
  }

  /*
   * Blog index is dynamic and allowed.
   */
  const indexPath =
    path.join(
      blogDir,
      'index.html'
    );

  fs.writeFileSync(
    indexPath,
    createBlogIndex(
      repoName,
      blogs
    ),
    'utf8'
  );

  console.log(
    `📚 Blog index generated.`
  );

  /*
   * Static pages intentionally return empty.
   */
  return {
    blogs,
    pages: []
  };
}