import fs from 'fs';
import path from 'path';

import {
  getCombinedTrends
} from './trend-engine.js';

import {
  generateAIContent
} from './strategy-engine.js';

import {
  sanitizeSlug,
  generateImage
} from './utils.js';

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

export async function generateTrendBlogs(
  repoName,
  domain,
  strategy = {}
) {
  console.log(
    `📈 Checking Google Trends for ${repoName}`
  );

  let trends = [];

  try {
    trends =
      await getCombinedTrends();
  } catch (error) {
    console.warn(
      `⚠️ Google Trends unavailable: ${error.message}`
    );
  }

  if (
    !Array.isArray(trends) ||
    trends.length === 0
  ) {
    console.log(
      `ℹ️ No trend topics found.`
    );

    return [];
  }

  const topTrends =
    trends
      .filter(Boolean)
      .map(
        trend =>
          String(trend).trim()
      )
      .filter(Boolean)
      .slice(0, 3);

  const blogDir =
    path.join(
      './docs',
      repoName,
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

  const newBlogs = [];

  for (const trend of topTrends) {
    const slug =
      sanitizeSlug(
        `trend-${trend}`
      );

    if (!slug) {
      continue;
    }

    const filePath =
      path.join(
        blogDir,
        `${slug}.html`
      );

    /*
     * Never overwrite an existing article.
     */
    if (fs.existsSync(filePath)) {
      console.log(
        `⏭️ Existing trend blog: ${slug}`
      );

      continue;
    }

    const url =
      `${domain}/blog/${slug}.html`;

    const prompt = `
Create a useful and fact-focused SEO article
about the following currently trending topic:

"${trend}"

Website context:
${strategy.niche || 'the website subject'}

Requirements:

- Explain the topic clearly.
- Explain why people may be searching for it.
- Provide useful background.
- Explain practical implications.
- Include relevant headings.
- Include a conclusion.
- Avoid unsupported statistics.
- Do not invent facts.
- Do not use keyword stuffing.
- Minimum 800 words.
- Return HTML only.
- Do not return markdown fences.
`;

    let content = '';

    try {
      content =
        await generateAIContent(
          prompt
        );
    } catch (error) {
      console.warn(
        `⚠️ AI trend generation failed: ${error.message}`
      );
    }

    if (
      !content ||
      content.trim().length < 300
    ) {
      content = `
<h2>${escapeHtml(trend)}</h2>

<p>
${escapeHtml(trend)} is currently attracting
attention in online search and discussions.
This article provides a general overview of
the topic and explains why it may be receiving
increased interest.
</p>

<h2>Why Is It Trending?</h2>

<p>
Search interest can increase when a topic is
connected with a recent event, product,
development, announcement, public discussion,
or other significant change. Readers should
always verify important information with
reliable sources.
</p>

<h2>What Should Readers Know?</h2>

<p>
The best way to understand a rapidly developing
topic is to identify the original information,
check multiple reliable sources, and distinguish
confirmed facts from speculation.
</p>

<h2>What Could Happen Next?</h2>

<p>
Future developments depend on new information,
public response, industry changes and other
factors. Any prediction should therefore be
treated as an informed possibility rather than
a certainty.
</p>

<h2>Conclusion</h2>

<p>
Trending topics can change quickly. Continue
checking reliable sources as new information
becomes available.
</p>
`;
    }

    const imageFilename =
      `${slug}.jpg`;

    const imagePath =
      path.join(
        imageDir,
        imageFilename
      );

    try {
      await generateImage(
        trend,
        imagePath
      );
    } catch (error) {
      console.warn(
        `⚠️ Image generation failed for ${trend}: ${error.message}`
      );
    }

    const generatedAt =
      new Date().toISOString();

    const html = `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

<title>${escapeHtml(trend)}</title>

<meta
  name="description"
  content="${escapeHtml(
    `Latest information and useful analysis about ${trend}`
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
  background: #f5f7fa;
  color: #222;
}

header {
  background: #111827;
  padding: 16px 20px;
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
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}

.article {
  background: white;
  padding: 30px;
  border-radius: 12px;
}

.featured-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 10px;
}

h1 {
  font-size: 42px;
  line-height: 1.2;
}

h2 {
  margin-top: 32px;
}

footer {
  margin-top: 50px;
  padding: 25px;
  background: #111827;
  color: white;
  text-align: center;
}

@media (max-width: 700px) {
  h1 {
    font-size: 30px;
  }

  .article {
    padding: 20px;
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

<main class="container">

<article class="article">

<img
  class="featured-image"
  src="/blog/images/${imageFilename}"
  alt="${escapeHtml(trend)}"
  loading="eager"
>

<h1>${escapeHtml(trend)}</h1>

${content}

<p>
  <small>
    Published: ${generatedAt}
  </small>
</p>

</article>

</main>

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

    newBlogs.push({
      slug,
      keyword: trend,
      url,
      date: generatedAt
    });

    console.log(
      `✅ Trend blog created: ${url}`
    );
  }

  return newBlogs;
}