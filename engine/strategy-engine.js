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
const getGeminiKey = () => GEMINI_KEYS[gIndex++ % GEMINI_KEYS.length]

// ================= DB =================
const loadDB = () => {
  try {
    return JSON.parse(fs.readFileSync(KEYWORD_DB_PATH))
  } catch {
    return []
  }
}

const saveDB = (data) => {
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

// ================= AI CLUSTER =================
async function generateCluster(seed) {
  if (!GEMINI_KEYS.length) return []

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${getGeminiKey()}`,
      {
        contents: [{
          parts: [{
            text: `
Generate 10 HIGH intent SEO keywords for "${seed}"

Include:
best, buy, review, tools, pricing, comparison

Return plain list
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
  console.log("🧠 HYBRID STRATEGY ENGINE")

  const db = loadDB()

  // 🔥 PRIORITY FLOW
  let seed = await getSerpTrend()

  if (seed) {
    console.log("🌐 SERP TREND:", seed)
  } else {
    seed = db.length
      ? db[Math.floor(Math.random() * db.length)]
      : "make money online"

    console.log("📦 LOCAL/DB:", seed)
  }

  let cluster = await generateCluster(seed)

  if (!cluster.length) {
    cluster = [
      seed,
      "best " + seed,
      "top " + seed,
      seed + " tools",
      seed + " review"
    ]
  }

  // 🔥 SAVE GROWTH
  const updated = [...new Set([...db, ...cluster])]
  saveDB(updated)

  return {
    niche: seed,
    cluster,
    createdAt: new Date().toISOString()
  }
}