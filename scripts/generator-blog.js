import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"
import { render, generateFallback } from "../core/template-engine.js"
import { injectAds } from "./monetization-engine.js"
import { SITE_CONFIG } from "../config/site-config.js"

export async function generateBlog(keywordData) {

  let aiData

  // 🔥 AI + FALLBACK SAFE SYSTEM
  try {
    aiData = await runUnifiedAI(keywordData)
  } catch (e) {
    console.log("⚠️ AI Failed → Using Fallback")
    aiData = generateFallback(keywordData.keyword)
  }

  // 🔥 DOUBLE SAFETY (IMPORTANT)
  if (!aiData || !aiData.content) {
    console.log("⚠️ Empty AI Response → Fallback")
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

    // 🔥 HANDLE BOTH STRING + OBJECT FORMAT
    const keywordList = all.map(k => typeof k === "string" ? k : k.keyword)

    related = keywordList
      .filter(k => k !== keywordData.keyword)
      .slice(0, 4)
  }

  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content,
    image,
    keywords: keywordData.keyword,
    path: `blog/${slug}.html`,
    SITE_URL: SITE_CONFIG.SITE_URL,

    // 🔥 SAFE RELATED
    related1: related[0] || "trending topic",
    related2: related[1] || "latest news",
    related3: related[2] || "best guide",
    related4: related[3] || "top tips"
  })

  if (!fs.existsSync("blog")) {
    fs.mkdirSync("blog")
  }

  fs.writeFileSync(`blog/${slug}.html`, html)

  console.log("✅ Blog:", slug)

  return { slug }
}