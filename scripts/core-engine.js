import { generateBlog } from "./generator-blog.js"

// 🔥 detect repo niche from repo name
function detectNiche() {
  const repo = process.env.GITHUB_REPOSITORY || "seo-engine"
  
  if (repo.includes("seo")) return "seo"
  if (repo.includes("crypto")) return "crypto"
  if (repo.includes("ai")) return "ai tools"
  if (repo.includes("health")) return "health"
  
  return "blogging"
}

// 🔥 trending style keywords (auto variation)
const modifiers = [
  "how to",
  "best",
  "top",
  "free",
  "latest",
  "guide",
  "2026"
]

function generateKeywords(niche) {
  return modifiers.map(m => ({
    keyword: `${m} ${niche}`,
    traffic: Math.floor(Math.random() * 100)
  }))
}

async function run() {

  const niche = detectNiche()
  console.log("🎯 Niche:", niche)

  const keywords = generateKeywords(niche)

  for (const k of keywords) {

    if (k.traffic < 20) continue

    console.log("🚀 Generating:", k.keyword)

    await generateBlog(k)
  }
}

run()