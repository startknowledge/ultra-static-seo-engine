import fs from 'fs';
import path from 'path';

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function ensureDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }
}

/*
 * SEO infrastructure generator.
 *
 * IMPORTANT:
 * This module does NOT:
 *
 * - create about.html
 * - create contact.html
 * - create privacy.html
 * - create faq.html
 * - create disclaimer.html
 * - create terms.html
 * - create cookies.html
 * - create documentation.html
 * - create support.html
 * - create changelog.html
 *
 * It also does NOT overwrite the project's
 * root sitemap.xml.
 */
export async function generateSEO(
  repoName,
  domain,
  blogs = [],
  pages = []
) {
  const repoRoot = path.join(
    './docs',
    repoName
  );

  ensureDirectory(repoRoot);

  /*
   * Only generated blog posts are used.
   *
   * The pages parameter is intentionally ignored.
   * This prevents any static-page system from
   * becoming part of the SEO generation pipeline.
   */
  const generatedBlogs =
    Array.isArray(blogs)
      ? blogs.filter(blog => {
          return (
            blog &&
            blog.url &&
            blog.keyword
          );
        })
      : [];

  /*
   * Generate RSS.
   *
   * RSS is dynamic content infrastructure,
   * not a fixed legal/information page.
   */
  const rssItems =
    generatedBlogs
      .map(blog => {
        const title =
          escapeXml(
            blog.keyword
          );

        const url =
          escapeXml(
            blog.url
          );

        const date =
          safeDate(
            blog.date
          );

        return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${date}</pubDate>
    </item>`;
      })
      .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(repoName)}</title>
    <link>${escapeXml(domain)}</link>
    <description>
      Latest articles and information from ${escapeXml(repoName)}
    </description>
    ${rssItems}
  </channel>
</rss>`;

  fs.writeFileSync(
    path.join(
      repoRoot,
      'rss.xml'
    ),
    rss,
    'utf8'
  );

  /*
   * Repository-level robots file.
   *
   * Sitemap is intentionally not added here because
   * the root sitemap is user-managed.
   */
  const robots = `User-agent: *
Allow: /
`;

  fs.writeFileSync(
    path.join(
      repoRoot,
      'robots.txt'
    ),
    robots,
    'utf8'
  );

  /*
   * JSON-LD schema.
   */
  const graph = [
    {
      '@type': 'WebSite',
      name: repoName,
      url: domain
    },
    {
      '@type': 'Organization',
      name: repoName,
      url: domain
    }
  ];

  for (const blog of generatedBlogs) {
    graph.push({
      '@type': 'BlogPosting',
      headline: blog.keyword,
      url: blog.url,
      datePublished: safeDate(
        blog.date
      )
    });
  }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': graph
  };

  fs.writeFileSync(
    path.join(
      repoRoot,
      'schema.json'
    ),
    JSON.stringify(
      schema,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    `🔎 SEO metadata generated for ${repoName}`
  );

  console.log(
    `🛡️ Static pages were not created or modified.`
  );

  console.log(
    `🛡️ Root sitemap.xml was not modified.`
  );

  return {
    blogs: generatedBlogs,
    pages: []
  };
}