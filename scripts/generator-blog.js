import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"
import { render, generateFallback } from "../core/template-engine.js"
import { injectAds } from "./monetization-engine.js"
import { SITE_CONFIG } from "../config/site-config.js"

export async function generateBlog(keywordData) {

  let aiData

  try {
    aiData = await runUnifiedAI(keywordData)
  } catch {
    aiData = generateFallback(keywordData.keyword)
  }

  const slug = keywordData.keyword
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")

  const image = `https://source.unsplash.com/featured/800x400?${encodeURIComponent(keywordData.keyword)}`

  // 🔥 CLEAN CONTENT
  let content = aiData.content
    .replace(/```html/g, "")
    .replace(/```/g, "")

  // 🔥 ADS
  content = injectAds(content)

  // 🔥 RELATED (AUTO FROM KEYWORDS FILE)
  let related = []
  if (fs.existsSync("data/keywords.json")) {
    const all = JSON.parse(fs.readFileSync("data/keywords.json"))
    related = all.filter(k => k !== keywordData.keyword).slice(0, 4)
  }

  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content,
    image,
    keywords: keywordData.keyword,
    path: `blog/${slug}.html`,
    SITE_URL: SITE_CONFIG.SITE_URL,
    related1: related[0] || "trending topic",
    related2: related[1] || "latest news",
    related3: related[2] || "best guide",
    related4: related[3] || "top tips"
  })

  if (!fs.existsSync("blog")) fs.mkdirSync("blog")

  fs.writeFileSync(`blog/${slug}.html`, html)

  console.log("✅ Blog:", slug)

  return { slug }
}