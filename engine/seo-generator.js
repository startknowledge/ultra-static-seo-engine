import fs from 'fs';

export async function generateSEO(repoName, domain, blogs, pages) {
  const repoRoot = `./docs/${repoName}`;
  if (!fs.existsSync(repoRoot)) fs.mkdirSync(repoRoot, { recursive: true });

  const allUrls = [...blogs, ...pages];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `<url><loc>${u.url}</loc><lastmod>${u.date}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`).join('')}
</urlset>`;
  fs.writeFileSync(`${repoRoot}/sitemap.xml`, sitemap);

  fs.writeFileSync(`${repoRoot}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);

  const rss = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>${repoName}</title><link>${domain}</link>
${blogs.map(b => `<item><title>${b.keyword}</title><link>${b.url}</link><pubDate>${b.date}</pubDate></item>`).join('')}
</channel></rss>`;
  fs.writeFileSync(`${repoRoot}/rss.xml`, rss);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "name": repoName, "url": domain },
      { "@type": "Organization", "name": repoName, "url": domain },
      ...blogs.map(b => ({ "@type": "BlogPosting", "headline": b.keyword, "url": b.url, "datePublished": b.date }))
    ]
  };
  fs.writeFileSync(`${repoRoot}/schema.json`, JSON.stringify(schema, null, 2));
}