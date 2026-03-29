import fs from "fs"

export async function generatePages(strategy) {
  const pages = ["about", "contact", "privacy"]

  pages.forEach(page => {
    const html = `<h1>${page} - ${strategy.niche}</h1>`
    fs.writeFileSync(`./dist/${page}.html`, html)
  })

  return pages
}