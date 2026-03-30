import fs from "fs"
import axios from "axios"

const KEYWORD_DB_PATH = "./data/keyword-db.json"

// ================= KEYS =================
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

const SERP_KEY = process.env.SERP_API_KEY1

let gIndex = 0
const getGeminiKey = () => {
  if (!GEMINI_KEYS.length) return null
  return GEMINI_KEYS[gIndex++ % GEMINI_KEYS.length]
}

// ================= DB =================
const loadDB = () => {
  try {
    return JSON.parse(fs.readFileSync(KEYWORD_DB_PATH))
  } catch {
    return []
  }
}

const saveDB = (data) => {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
  fs.writeFileSync(KEYWORD_DB_PATH, JSON.stringify(data, null, 2))
}

// ================= SERP TREND =================
async function getSerpTrend() {
  if (!SERP_KEY) return null

  try {
    const res = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_trends",
        geo: "IN",
        api_key: SERP_KEY
      }
    })

    const trends = res.data?.trending_searches_days?.[0]?.trending_searches || []

    if (!trends.length) return null

    const random = trends[Math.floor(Math.random() * trends.length)]

    return random?.title?.query || null
  } catch {
    return null
  }
}

// ================= GEMINI CLUSTER =================
async function generateCluster(seed) {
  const key = getGeminiKey()
  if (!key) return []

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}`,
      {
        contents: [{
          parts: [{
            text: `
Generate 15 HIGH intent SEO keywords for "${seed}"

Include:
- best
- buy
- review
- tools
- pricing
- comparison
- near me

Return only list
`
          }]
        }]
      }
    )

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return text
      .split("\n")
      .map(k => k.replace(/^\d+\. /, "").trim())
      .filter(Boolean)

  } catch {
    return []
  }
}

// ================= MAIN =================
export async function runStrategy() {
  console.log("🧠 ADVANCED STRATEGY ENGINE")

  const db = loadDB()

  // 🔥 PRIORITY: SERP → DB → DEFAULT
  let seed = await getSerpTrend()

  if (seed) {
    console.log("🌐 TREND:", seed)
  } else if (db.length) {
    seed = db[Math.floor(Math.random() * db.length)]
    console.log("📦 DB:", seed)
  } else {
    seed = "make money online"
    console.log("⚠️ DEFAULT:", seed)
  }

  // 🔥 AI CLUSTER
  let cluster = await generateCluster(seed)

  // 🔥 FALLBACK (ZERO API MODE)
  if (!cluster.length) {
    cluster = [
      seed,
      `best ${seed}`,
      `top ${seed}`,
      `${seed} tools`,
      `${seed} review`,
      `${seed} pricing`,
      `${seed} guide`
    ]
  }

  // 🔥 SELF LEARNING DB
  const updatedDB = [...new Set([...db, ...cluster])]
  saveDB(updatedDB)

  return {
    niche: seed,
    cluster,
    createdAt: new Date().toISOString()
  }
}