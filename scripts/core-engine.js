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

  // 🔥 STEP 2: FETCH REAL TRENDS
  const trends = await fetchTrends(niche)

  // 🔥 STEP 3: GENERATE KEYWORDS
  const keywords = generateKeywords(niche, trends)

  fs.writeFileSync("data/keywords.json", JSON.stringify(keywords, null, 2))

  console.log("🔥 Keywords:", keywords.length)

  let count = 0
  const MAX_DAILY = 50 // 🔥 LIMIT CONTROL

  for (const k of keywords) {

    if (count >= MAX_DAILY) break

    const keywordData = {
      keyword: k,
      traffic: Math.floor(Math.random() * 100)
    }

    if (keywordData.traffic < 40) continue

    console.log(`🚀 [${++count}]`, k)

    await generateBlog(keywordData)
  }

  // 🔗 STEP 4: ADD INTERNAL LINKS
  runLinkEngine()

  console.log("🎯 DONE:", count)
}

run()