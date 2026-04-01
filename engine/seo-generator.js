import fs from 'fs';

// Generate sitemap.xml, robots.txt, rss.xml, and schema.json for a repo
export async function generateSEO(repoName, domain, blogs, pages) {
  const docsDir = `./docs/${repoName}`;
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  // ---- Sitemap.xml ----
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${[...blogs, ...pages].map(item => `
  <url>
    <loc>${item.url}</loc>
    <image:image>
      <image:loc>https://source.unsplash.com/800x600/?${encodeURIComponent(item.keyword || item.slug)}</image:loc>
    </image:image>
    <lastmod>${item.date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;
  fs.writeFileSync(`${docsDir}/sitemap.xml`, sitemap);

  // ---- Robots.txt ----
  fs.writeFileSync(`${docsDir}/robots.txt`, `
User-agent: *
Allow: /
Sitemap: ${domain}/sitemap.xml
`);

  // ---- RSS feed ----
  const rss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <title>${repoName}</title>
  <link>${domain}</link>
  <description>Latest updates from ${repoName}</description>
  ${blogs.map(b => `
  <item>
    <title>${b.keyword}</title>
    <link>${b.url}</link>
    <pubDate>${b.date}</pubDate>
    <guid>${b.url}</guid>
  </item>`).join('')}
</channel>
</rss>`;
  fs.writeFileSync(`${docsDir}/rss.xml`, rss);

  // ---- JSON-LD Schema (WebSite + BlogPosting) ----
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": repoName,
        "url": domain
      },
      {
        "@type": "Organization",
        "name": repoName,
        "url": domain
      },
      ...blogs.map(b => ({
        "@type": "BlogPosting",
        "headline": b.keyword,
        "url": b.url,
        "datePublished": b.date,
        "author": {
          "@type": "Organization",
          "name": repoName
        }
      }))
    ]
  };
  fs.writeFileSync(`${docsDir}/schema.json`, JSON.stringify(schema, null, 2));
}