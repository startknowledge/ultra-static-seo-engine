import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { SETTINGS } from "../config/settings.js"

export async function generateBlogs(strategy) {
  const blogs = []

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    const content = await generateAIContent(`
Write a detailed SEO optimized blog on "${keyword}"
Include headings, FAQs, and tips.
    `)

    const slug = keyword.replace(/\s+/g, "-")

    const html = `
<!DOCTYPE html>
<html>
<head>
<title>${keyword} | ${SETTINGS.siteName}</title>
<meta name="description" content="${keyword} guide">
<link rel="canonical" href="${SETTINGS.domain}/${slug}.html">
</head>

<body>
<h1>${keyword}</h1>
${content}
</body>
</html>
`

    fs.writeFileSync(`./dist/${slug}.html`, html)

    blogs.push({
      slug,
      keyword,
      url: `${SETTINGS.domain}/${slug}.html`,
      date: new Date().toISOString()
    })
  }

  return blogs
}