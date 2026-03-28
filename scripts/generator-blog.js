import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"
import { render, generateFallback } from "../core/template-engine.js"
import { injectAds } from "./monetization-engine.js"
import { SITE_CONFIG } from "../config/site-config.js"

let usage = 0
let currentKey = 0

function switchKey() {
  currentKey++
  console.log("🔁 Switching API Key:", currentKey)
}

export async function generateBlog(keywordData) {

  let aiData
  let success = false
  let attempts = 0
  const MAX_RETRY = 3

  // 🔥 AI RETRY SYSTEM
  while (!success && attempts < MAX_RETRY) {
    try {

      if (usage >= 5) {
        switchKey()
        usage = 0
      }

      console.log(`🤖 AI generating: ${keywordData.keyword} (Try ${attempts + 1})`)

      aiData = await runUnifiedAI(keywordData)

      usage++
      success = true

    } catch (e) {
      console.log("⚠️ Retry with next key...")
      switchKey()
      attempts++
    }
  }

  // 🔥 FINAL FALLBACK
  if (!success) {
    console.log("❌ AI failed completely → fallback")
    aiData = generateFallback(keywordData.keyword)
  }

  // 🔥 SLUG
  const slug = keywordData.keyword
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")

  // 🔥 IMAGE
  const image = `https://source.unsplash.com/featured/800x400?${encodeURIComponent(keywordData.keyword)}`

  // 🔥 ADS + CONTENT
  let content = injectAds(aiData.content)

  // 🔥 INTERNAL LINK
  content = content.replace(
    /<p>/,
    `<p><a href="/blog/${slug}.html">${keywordData.keyword}</a> `
  )

  // 🔥 HTML RENDER
  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content,
    image,
    keywords: keywordData.keyword,
    path: `blog/${slug}.html`,
    SITE_URL: SITE_CONFIG.SITE_URL
  })

  // 🔥 CREATE BLOG FOLDER
  if (!fs.existsSync("blog")) {
    fs.mkdirSync("blog")
  }

  // 🔥 SAVE BLOG
  fs.writeFileSync(`blog/${slug}.html`, html)

  console.log("✅ Blog:", slug)

  // 🔥 SAVE POST DATA
  const post = {
    title: aiData.title,
    slug,
    date: new Date().toISOString()
  }

  const dataFile = "data/posts.json"
  let posts = []

  if (fs.existsSync(dataFile)) {
    posts = JSON.parse(fs.readFileSync(dataFile))
  }

  posts.push(post)

  fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2))

  return { slug }
}