import fs from "fs"
import { generateBlog } from "./generator-blog.js"
import { fetchTrends } from "./trend-engine.js"
import { detectNiche } from "./niche-engine.js"
import { generateKeywords } from "./keyword-engine.js"
import { cleanBadBlogs } from "./cleanup-engine.js"
import { runLinkEngine } from "./link-engine.js"
import { runPingEngine } from "./ping-engine.js"
import { runBacklinkEngine } from "./backlink-engine.js"
import { runMonetization } from "./monetization-engine.js"
import { runClusterEngine } from "./cluster-engine.js"
import { runRefreshEngine } from "./refresh-engine.js"


async function run() {

  console.log("🚀 FULL AUTO SEO ENGINE STARTED")

  // 🔥 STEP 1: CLEAN OLD GARBAGE
  cleanBadBlogs()

  const repo = process.env.GITHUB_REPOSITORY || "seo-engine"

  const niches = [ 
    // 🔥 tech / trending
  "technology", "software development",
  "web development", "mobile apps",
  "saas", "cloud computing", "cybersecurity",
  "data science", "machine learning",
  "automation",

  // 💰 business / money
  "online business", "startup", "entrepreneurship",
  "ecommerce", "dropshipping", "investing",
  "stock market", "passive income",
  "side hustle", "personal finance",

  // 📈 marketing
  "content marketing", "social media marketing",
  "email marketing", "branding", "growth hacking",
  "sales funnel", "lead generation",
  "copywriting",

  // 🎥 creator economy
  "content creation", "video editing",
  "instagram growth", "tiktok marketing",
  "youtube automation", "podcasting",
  "influencer marketing",

  // 🧠 education / skills
  "online learning", "self improvement",
  "productivity", "time management",
  "career growth", "skills development",

  // 🏥 lifestyle / health
  "health", "fitness", "weight loss", "mental health",
  "nutrition", "yoga", "meditation",

  // 🌍 misc high demand
  "travel", "food", "gaming", "photography",
  "real estate", "parenting",
  "relationships", "fashion", "beauty",

  "ai", "make money online",
  "affiliate marketing", "blogging",
  "digital marketing", "crypto",
  "finance", "youtube", "freelancing", "seo"  
]

// 🔥 random niche every run
const niche = niches[Math.floor(Math.random() * niches.length)]

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
  const MAX_DAILY = 5

  for (const k of keywords) {

    if (count >= MAX_DAILY) break

    const keywordData = {
      keyword: k,
      traffic: Math.floor(Math.random() * 100)
    }

    if (keywordData.traffic < 30) continue

    console.log(`🚀 [${++count}]`, k)

    await generateBlog(keywordData)
    // 🔥 RATE LIMIT PROTECTION (VERY IMPORTANT)
await new Promise(r => setTimeout(r, 5000))
  }
// after blog generation
runClusterEngine()
runMonetization()
runBacklinkEngine()
runPingEngine()
runRefreshEngine()

  // 🔗 FINAL LINKING
  runLinkEngine()

  console.log("🎯 DONE:", count)
}

run()