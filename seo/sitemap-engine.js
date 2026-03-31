import fs from "fs"
import { SETTINGS } from "../config/settings.js"

function generateImageUrl(keyword) {
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}`
}

export async function generateSitemap(blogs, pages) {
  const urls = [...blogs, ...pages]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

${urls.map(u => `
<url>
  <loc>${u.url}</loc>
  <image:image>
    <image:loc>${generateImageUrl(u.keyword || u.slug)}</image:loc>
  </image:image>
  <lastmod>${u.date}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>`).join("")}

</urlset>`

  fs.writeFileSync("./docs/sitemap.xml", xml)

  // RSS
  const rss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
<title>${SETTINGS.siteName}</title>
<link>${SETTINGS.domain}</link>

${blogs.map(b => `
<item>
<title>${b.keyword}</title>
<link>${b.url}</link>
<pubDate>${b.date}</pubDate>
</item>`).join("")}

</channel>
</rss>`

  fs.writeFileSync("./docs/rss.xml", rss)

  // robots
  fs.writeFileSync("./docs/robots.txt", `
User-agent: *
Allow: /
Sitemap: ${SETTINGS.domain}/sitemap.xml
`)
}