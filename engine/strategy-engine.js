import fs from "fs"
import axios from "axios"

const DB = "./data/keyword-db.json"

// 🔑 KEYS
const KEYS = [
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

let i = 0
const getKey = () => KEYS[i++ % KEYS.length]

// 📦 DB
function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB))
  } catch {
    return []
  }
}

function saveDB(data) {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
  fs.writeFileSync(DB, JSON.stringify(data, null, 2))
}

// 🌐 GOOGLE TREND
async function getTrend() {
  try {
    const res = await axios.get("https://trends.google.com/trending/rss?geo=IN")
    const xml = res.data

    const matches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]

    const list = matches
      .map(m => m[1])
      .filter(k => k && k !== "Daily Search Trends")

    if (!list.length) return null

    return list[Math.floor(Math.random() * list.length)]
  } catch {
    console.log("⚠️ Trend fetch failed")
    return null
  }
}

// 🤖 GEMINI
async function generateCluster(seed) {
  const key = getKey()
  if (!key) return []

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Generate SEO search queries for "${seed}" in list format`
              }
            ]
          }
        ]
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

// 🚀 MAIN
export async function runStrategy(context) {
  console.log("🧠 AI STRATEGY")

  const db = loadDB()

  // 🔥 1. try Google trend
  let seed = await getTrend()

  // 🔥 2. fallback → repo context (NO HARDCODE)
  if (!seed) {
    seed = context.niche
    console.log("📂 Repo fallback:", seed)
  }

  console.log("🌐 SEED:", seed)

  // 🔥 3. generate cluster
  let cluster = await generateCluster(seed)

  if (!cluster || cluster.length === 0) {
    console.log("⚠️ AI failed → using seed")
    cluster = [seed]
  }

  // 🔥 clean
  cluster = [...new Set(cluster.map(k => k.toLowerCase()))]

  // 🔥 save learning
  const updatedDB = [...new Set([...db, ...cluster])]
  saveDB(updatedDB)

  return {
    niche: seed,
    cluster,
    createdAt: new Date().toISOString()
  }
}