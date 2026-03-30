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

// ================= REAL GOOGLE TRENDS =================
async function getRealGoogleTrend() {
  try {
    const res = await axios.get(
      "https://trends.google.com/trending/rss?geo=IN"
    )

    const xml = res.data

    const matches = [
      ...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)
    ]

    const keywords = matches
      .map(m => m[1])
      .filter(k => k && k !== "Daily Search Trends")

    if (!keywords.length) return null

    const random = keywords[Math.floor(Math.random() * keywords.length)]

    return random
  } catch (err) {
    console.log("⚠️ Trend fetch failed")
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
best, buy, review, tools, pricing, comparison, near me

Return only keywords list (no explanation)
`
          }]
        }]
      }
    )

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return text
      .split("\n")
      .map(k => k.replace(/^\d+\. /, "").trim())
      .filter(Boolean)

  } catch (err) {
    console.log("⚠️ Gemini failed")
    return []
  }
}

// ================= MAIN =================
export async function runStrategy() {
  console.log("🧠 ADVANCED STRATEGY ENGINE START")

  const db = loadDB()

  // 🔥 PRIORITY: REAL GOOGLE TREND
  let seed = await getRealGoogleTrend()

  if (seed) {
    console.log("🌐 GOOGLE TREND:", seed)
  } else if (db.length) {
    seed = db[Math.floor(Math.random() * db.length)]
    console.log("📦 DB FALLBACK:", seed)
  } else {
    seed = "make money online"
    console.log("⚠️ DEFAULT:", seed)
  }

  // 🔥 AI CLUSTER
  let cluster = await generateCluster(seed)

  // 🔥 ZERO API MODE
  if (!cluster.length) {
    cluster = [
      seed,
      `best ${seed}`,
      `top ${seed}`,
      `${seed} tools`,
      `${seed} review`,
      `${seed} pricing`,
      `${seed} guide`,
      `${seed} near me`
    ]
  }

  // 🔥 CLEAN + UNIQUE
  cluster = [...new Set(cluster.map(k => k.toLowerCase()))]

  // 🔥 SELF LEARNING DB
  const updatedDB = [...new Set([...db, ...cluster])]
  saveDB(updatedDB)

  console.log("✅ Keywords Generated:", cluster.length)

  return {
    niche: seed,
    cluster,
    createdAt: new Date().toISOString()
  }
}