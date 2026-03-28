import fs from "fs"
import { generateBlog } from "./generator-blog.js"
import { fetchTrends } from "./trend-engine.js"
import { detectNiche } from "./niche-engine.js"
import { generateKeywords } from "./keyword-engine.js"
import { cleanBadBlogs } from "./cleanup-engine.js"
import { runLinkEngine } from "./link-engine.js"

async function run() {

  console.log("🚀 FULL AUTO SEO ENGINE STARTED")

  // 🔥 STEP 1: CLEAN OLD GARBAGE
  cleanBadBlogs()

  const repo = process.env.GITHUB_REPOSITORY || "seo-engine"

  const niche = detectNiche(repo)
  console.log("🎯 Niche:", niche)

  // 🔥 STEP 2: FETCH TRENDS
  let trends = []
  try {
    trends = await fetchTrends(niche)
  } catch (e) {
    console.log("⚠️ Trend fetch failed")
  }

  console.log("📈 Trends:", trends.length)

  // 🔥 STEP 3: SMART KEYWORD ENGINE (FIX)
  let keywords = []

  if (trends && trends.length > 0) {
    keywords = trends
    console.log("🔥 Using REAL trends")
  } else {
    keywords = generateKeywords(niche)
    console.log("⚡ Using fallback keywords")
  }

  fs.writeFileSync("data/keywords.json", JSON.stringify(keywords, null, 2))

  console.log("🔥 Keywords:", keywords.length)

  let count = 0
  const MAX_DAILY = 50

  for (const k of keywords) {

    if (count >= MAX_DAILY) break

    const keywordData = {
      keyword: k,
      traffic: Math.floor(Math.random() * 100)
    }

    if (keywordData.traffic < 30) continue

    console.log(`🚀 [${++count}]`, k)

    await generateBlog(keywordData)
  }

  // 🔗 FINAL LINKING
  runLinkEngine()

  console.log("🎯 DONE:", count)
}

run()