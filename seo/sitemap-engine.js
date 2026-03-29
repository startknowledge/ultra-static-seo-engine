import fs from "fs"

export async function generateSitemap(blogs, pages) {
  let urls = ""

  blogs.forEach(b => {
    urls += `<url><loc>/${b.slug}.html</loc></url>`
  })

  pages.forEach(p => {
    urls += `<url><loc>/${p}.html</loc></url>`
  })

  const sitemap = `<urlset>${urls}</urlset>`

  fs.writeFileSync("./dist/sitemap.xml", sitemap)

  // robots.txt
  fs.writeFileSync("./dist/robots.txt", "User-agent: *\nAllow: /")

  // RSS
  fs.writeFileSync("./dist/rss.xml", `<rss>${urls}</rss>`)
}