import fs from "fs"
import { generateBlog } from "./generator-blog.js"
import { fetchTrends } from "./trend-engine.js"
import { cleanBadBlogs } from "./cleanup-engine.js"
import { runLinkEngine } from "./link-engine.js"
import { runPingEngine } from "./ping-engine.js"
import { runBacklinkEngine } from "./backlink-engine.js"
import { runMonetization } from "./monetization-engine.js"
import { runClusterEngine } from "./cluster-engine.js"
import { runRefreshEngine } from "./refresh-engine.js"
import { submitToGoogle } from "./indexing-engine.js"
import { SITE_CONFIG } from "../config/site-config.js"
niches array
async function run() {

  console.log("🚀 FULL AUTO SEO ENGINE STARTED")

  cleanBadBlogs()

  // 🔥 ONLY TREND BASED (NO STATIC NICHE)
  let keywords = await fetchTrends("trending")

  if (!keywords || keywords.length === 0) {
    console.log("❌ No trends found → stopping")
    return
  }

  fs.writeFileSync("data/keywords.json", JSON.stringify(keywords, null, 2))

  let count = 0
  const MAX_DAILY = 5

  for (const k of keywords) {

    if (count >= MAX_DAILY) break

    console.log(`🚀 [${++count}]`, k)

    const result = await generateBlog({ keyword: k })

    await new Promise(r => setTimeout(r, 5000))

    await submitToGoogle(
      `${SITE_CONFIG.SITE_URL}/blog/${result.slug}.html`
    )
  }

  runClusterEngine()
  runMonetization()
  runBacklinkEngine()
  runPingEngine()
  runRefreshEngine()
  runLinkEngine()

  console.log("🎯 DONE:", count)
}

run()