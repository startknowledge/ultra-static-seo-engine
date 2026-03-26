import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"
import { render } from "../core/template-engine.js"

export async function generateBlog(keywordData) {

  const aiData = await runUnifiedAI(keywordData)

  const slug = keywordData.keyword
    .toLowerCase()
    .replace(/\s+/g, "-")

  // 🔥 IMAGE AUTO
  const image = `https://source.unsplash.com/800x400/?${encodeURIComponent(keywordData.keyword)}`

  // 🔥 RANDOM RELATED LINKS
  const related = [
    "seo-2026",
    "ai-blogging",
    "best-seo-tools",
    "make-money-online"
  ]

  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content: aiData.content,
    image: image,
    related1: related[0],
    related2: related[1],
    related3: related[2],
    related4: related[3],
    keywords: keywordData.keyword,
    path: `blog/${slug}.html`
  })

  fs.writeFileSync(`blog/${slug}.html`, html)

  console.log("✅ Blog:", slug)

  return {
    slug,
    ...aiData
  }
}