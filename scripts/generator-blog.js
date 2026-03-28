import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"
import { render } from "../core/template-engine.js"
import { injectAds } from "./monetization-engine.js"
import { generateFallback } from "../core/template-engine.js"

export async function generateBlog(keywordData) {

  let aiData

  try {
    aiData = await runUnifiedAI(keywordData)
  } catch (e) {
    console.log("⚠️ AI Failed → Fallback")
    aiData = generateFallback(keywordData.keyword)
  }

  const slug = keywordData.keyword
    .toLowerCase()
    .replace(/\s+/g, "-")

  const image = `https://source.unsplash.com/800x400/?${encodeURIComponent(keywordData.keyword)}`

  let contentWithAds = injectAds(aiData.content)

  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content: contentWithAds,
    image: image,
    keywords: keywordData.keyword,
    path: `blog/${slug}.html`
  })

  if (!fs.existsSync("blog")) {
    fs.mkdirSync("blog")
  }

  fs.writeFileSync(`blog/${slug}.html`, html)

  console.log("✅ Blog:", slug)

  return { slug }
}