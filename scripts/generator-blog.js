import fs from "fs"
import { runUnifiedAI } from "../ai/ai-engine.js"
import { render, generateFallback } from "../core/template-engine.js"
import { injectAds } from "./monetization-engine.js"

let usage = 0
let currentKey = 0

function switchKey() {
  console.log("🔁 Switching API Key (mock)")
}
export async function generateBlog(keywordData) {

  let aiData

  try {

    // 🔥 KEY LIMIT FIX
    if (usage >= 5) {
      switchKey()
      usage = 0
      console.log("🔁 Switching API KEY:", currentKey + 1)
    }

    aiData = await runUnifiedAI(keywordData)

} catch (e) {
  console.log("⚠️ AI Failed → Fallback")
  aiData = generateFallback(keywordData.keyword)
}

  const slug = keywordData.keyword
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "") // 🔥 clean slug

  const image = `https://source.unsplash.com/800x400/?${encodeURIComponent(keywordData.keyword)}`

  // 🔥 inject ads
  let content = injectAds(aiData.content)

  // 🔥 basic internal linking (inline)
  content = content.replace(/<p>/, `<p><a href="/blog/${slug}.html">${keywordData.keyword}</a> `)

  const html = render("templates/blog-template.html", {
    title: aiData.title,
    description: aiData.description,
    content,
    image,
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