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

// ================= GOOGLE TRENDS =================
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

    return keywords[Math.floor(Math.random() * keywords.length)]

  } catch {
    console.log("⚠️ Trend fetch failed")
    return null
  }
}

// ================= GEMINI =================
async function generateCluster(seed) {
  const key = getGeminiKey()
  if (!key) return []

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}`,
      {
        contents: [{
          parts: [{
            text: `Generate related search queries for "${seed}"`
          }]
        }]
      }
    )

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return text
      .split("\n")
      .map(k => k.trim())
      .filter(Boolean)

  } catch {
    console.log("⚠️ Gemini failed")
    return []
  }
}

// ================= MAIN =================
export async function runStrategy() {
  console.log("🧠 PURE AI STRATEGY ENGINE")

  const db = loadDB()

  // 🔥 ONLY REAL TREND
  let seed = await getRealGoogleTrend()

  if (!seed && db.length) {
    seed = db[Math.floor(Math.random() * db.length)]
    console.log("📦 DB fallback:", seed)
  }

  if (!seed) {
    console.log("❌ No seed found → skipping run")
    return { niche: null, cluster: [] }
  }

  console.log("🌐 TREND:", seed)

  // 🔥 AI CLUSTER
  let cluster = await generateCluster(seed)

  // 🔥 IF AI FAIL → ONLY USE SEED
  if (!cluster.length) {
    cluster = [seed]
  }

  // 🔥 CLEAN
  cluster = [...new Set(cluster.map(k => k.toLowerCase()))]

  // 🔥 SAVE LEARNING
  const updatedDB = [...new Set([...db, ...cluster])]
  saveDB(updatedDB)

  return {
    niche: seed,
    cluster,
    createdAt: new Date().toISOString()
  }
}