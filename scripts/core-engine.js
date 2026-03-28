import { generateBlog } from "./generator-blog.js"
import { fetchTrends } from "./trend-engine.js"
import { detectNiche } from "./niche-engine.js"
import { generateKeywords } from "./keyword-engine.js"

// delay (API safe)
function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

async function run() {

  console.log("🚀 FULL AUTO SEO ENGINE STARTED")

  const repo = process.env.GITHUB_REPOSITORY || "auto-blog-engine"

  // 🔥 auto niche
  const niche = detectNiche(repo)
  console.log("🎯 Niche:", niche)

  // 🔥 real trends
  const trends = await fetchTrends(niche)

  // 🔥 smart keywords
  const keywords = generateKeywords(niche, trends)

  console.log("🔥 Keywords:", keywords.length)

  let count = 0

  for (const k of keywords) {

    if (count >= 50) break

    console.log(`🚀 [${count+1}]`, k)

    try {
      await generateBlog({
        keyword: k,
        traffic: 80
      })
      count++
    } catch (e) {
      console.log("❌ Failed:", k)
    }

    await sleep(1500)
  }

  console.log("🎯 DONE:", count)
}

run()