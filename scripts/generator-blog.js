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
    console.log("⚠️ AI Failed → Using Fallback")
    aiData = generateFallback(keywordData.keyword)
  }

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

  // 🔥 IMPORTANT: Inject Ads INSIDE CONTENT
  let contentWithAds = injectAds(aiData.content)

  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content: contentWithAds,   // ✅ UPDATED HERE
    image: image,
    related1: related[0],
    related2: related[1],
    related3: related[2],
    related4: related[3],
    keywords: keywordData.keyword,
    path: `blog/${slug}.html`
  })

  // ensure folder exists
  if (!fs.existsSync("blog")) {
    fs.mkdirSync("blog")
  }

  fs.writeFileSync(`blog/${slug}.html`, html)

  console.log("✅ Blog:", slug)

  return {
    slug,
    ...aiData
  }
}