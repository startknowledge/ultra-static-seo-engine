import fs from "fs"
import { generateBlog } from "./generator-blog.js"
import { fetchTrends } from "./trend-engine.js"

// 🔥 detect repo niche
function detectNiche() {
  const repo = process.env.GITHUB_REPOSITORY || "seo-engine"
  
  if (repo.includes("seo")) return "seo"
  if (repo.includes("crypto")) return "crypto"
  if (repo.includes("ai")) return "ai tools"
  if (repo.includes("health")) return "health"
  
  return "blogging"
}

// 🔥 modifiers (base keywords)
const modifiers = [
   "how to","best","top","free","latest","guide","2026",
"fast","easy","complete","advanced","strategy","tips",
"tutorial","tools","software","platform","course",

"review","comparison","vs","alternatives","examples",
"ideas","checklist","framework","methods","techniques",
"hacks","secrets","pro","expert","beginner","starter",
"step by step","case study","templates","resources",
"services","solutions","systems","automation","workflow",
"setup","installation","configuration","optimization",
"improvement","growth","scaling","performance","analysis",
"insights","trends","updates","news","future",
"pricing","cost","budget","cheap","premium",
"features","benefits","pros and cons","limitations",
"use cases","applications","industries","niche",
"tools list","software list","platform list",
"course free","course online","certification",
"download","free download","demo","trial",
"best practices","mistakes","errors","fix","troubleshooting"
]

// 🔥 base keyword generator
function generateKeywords(niche) {
  return modifiers.map(m => ({
    keyword: `${m} ${niche}`,
    traffic: Math.floor(Math.random() * 100)
  }))
}

// 🔥 delay (for API safety)
function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

// 🚀 MAIN SYSTEM (AUTO SCALE)
async function run() {

  console.log("🚀 AUTO BLOG SYSTEM STARTED")

  // ✅ Step 1: fetch trends
  await fetchTrends()

  const niche = detectNiche()
  console.log("🎯 Niche:", niche)

  // ✅ Step 2: generate base keywords
  let keywords = generateKeywords(niche)

  // ✅ Step 3: override with trends (REAL POWER 🔥)
  if (fs.existsSync("data/trends.json")) {

    const trends = JSON.parse(fs.readFileSync("data/trends.json", "utf-8"))

    if (trends[niche]) {

      console.log("🔥 Using TREND keywords")

      keywords = trends[niche].map(k => ({
        keyword: k,
        traffic: 90
      }))
    }
  }

  // 🔥 STEP 4: SCALE LOOP (50 BLOGS/DAY)
  let count = 0
  const MAX_BLOGS = 50

  for (const k of keywords) {

    if (count >= MAX_BLOGS) break

    if (k.traffic < 20) continue

    console.log(`🚀 [${count+1}] Generating:`, k.keyword)

    try {
      await generateBlog(k)
      count++
    } catch (e) {
      console.log("❌ Failed:", k.keyword)
    }

    // 🔥 API SAFE DELAY
    await sleep(2000)
  }

  console.log(`🎯 DONE: ${count} blogs generated`)
}

run()