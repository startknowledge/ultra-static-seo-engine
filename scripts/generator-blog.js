import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"

export async function generateBlog(keywordData) {

  const aiData = await runUnifiedAI(keywordData)

  const slug = keywordData.keyword
    .toLowerCase()
    .replace(/\s+/g, "-")

  const html = `
  <html>
    <head>
      <title>${aiData.title}</title>
      <meta name="description" content="${aiData.description}">
    </head>
    <body>
      ${aiData.content}
    </body>
  </html>
  `

  fs.writeFileSync(`blog/${slug}.html`, html)

  return {
    slug,
    ...aiData
  }
}