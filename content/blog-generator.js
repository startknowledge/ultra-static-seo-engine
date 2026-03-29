import fs from "fs"

export async function generateBlogs(strategy) {
  const blogs = []

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  strategy.cluster.forEach((keyword, i) => {
    const slug = keyword.replace(/\s+/g, "-")

    const html = `
    <html>
    <head><title>${keyword}</title></head>
    <body>
      <h1>${keyword}</h1>
      <p>Auto-generated content for ${keyword}</p>
    </body>
    </html>`

    fs.writeFileSync(`./dist/${slug}.html`, html)

    blogs.push({ slug, keyword })
  })

  return blogs
}