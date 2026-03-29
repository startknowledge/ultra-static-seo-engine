import fs from "fs"
import axios from "axios"

// ================= CONFIG =================
const CACHE_PATH = "./data/trends-cache.json"
const USAGE_PATH = "./data/serp-usage.json"

// 🔑 KEYS (sequence maintained)
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
]

const SERP_KEYS = [
  process.env.SERP_API_KEY1
]

// 🔁 rotation
let gIndex = 0
let sIndex = 0

function getGeminiKey() {
  const key = GEMINI_KEYS[gIndex % GEMINI_KEYS.length]
  gIndex++
  return key
}

function getSerpKey() {
  const key = SERP_KEYS[sIndex % SERP_KEYS.length]
  sIndex++
  return key
}

// ================= LOCAL DB =================
const KEYWORD_DB = [
  "seo tips",
  "make money online",
  "ai tools",
  "blogging 2026",
  "affiliate marketing",
  "youtube growth",
  "freelancing"
]

function getLocalKeyword() {
  return KEYWORD_DB[Math.floor(Math.random() * KEYWORD_DB.length)]
}

// ================= CACHE =================
function loadCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null
    return JSON.parse(fs.readFileSync(CACHE_PATH))
  } catch {
    return null
  }
}

function saveCache(data) {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2))
}

function isExpired(cache) {
  return (Date.now() - new Date(cache.createdAt)) > (12 * 60 * 60 * 1000)
}

// ================= USAGE =================
function getUsage() {
  try {
    if (!fs.existsSync(USAGE_PATH)) {
      return { count: 0, month: new Date().getMonth() }
    }

    const data = JSON.parse(fs.readFileSync(USAGE_PATH))

    if (data.month !== new Date().getMonth()) {
      return { count: 0, month: new Date().getMonth() }
    }

    return data
  } catch {
    return { count: 0, month: new Date().getMonth() }
  }
}

function saveUsage(data) {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
  fs.writeFileSync(USAGE_PATH, JSON.stringify(data, null, 2))
}

// ================= GEMINI AI =================
async function getGeminiTrend() {
  try {
    const apiKey = getGeminiKey()

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Give 1 trending SEO keyword for 2026 (short keyword only)"
              }
            ]
          }
        ]
      }
    )

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return text.split("\n")[0] || getLocalKeyword()
  } catch {
    return getLocalKeyword()
  }
}

// ================= SERP =================
async function getSerpTrend() {
  try {
    const apiKey = getSerpKey()

    const res = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_trends",
        geo: "IN",
        api_key: apiKey
      }
    })

    const trends =
      res.data?.trending_searches_days?.[0]?.trending_searches || []

    if (!trends.length) throw new Error()

    const random = trends[Math.floor(Math.random() * trends.length)]
    return random?.title?.query || getLocalKeyword()
  } catch {
    return getLocalKeyword()
  }
}

// ================= MAIN =================
export async function runStrategy() {
  console.log("🧠 Strategy Engine Start")

  // 1. CACHE
  const cache = loadCache()
  if (cache && !isExpired(cache)) {
    console.log("⚡ CACHE USED")
    return cache
  }

  const usage = getUsage()

  let keyword

  // 2. HYBRID STRATEGY
  if (usage.count < 30) {
    console.log("🌐 Using SERP (real trends)")
    keyword = await getSerpTrend()
    usage.count++
    saveUsage(usage)
  } else if (usage.count < 90) {
    console.log("🤖 Using GEMINI (AI trends)")
    keyword = await getGeminiTrend()
  } else {
    console.log("📦 ZERO API MODE (local DB)")
    keyword = getLocalKeyword()
  }

  const data = {
    niche: keyword,
    cluster: [keyword],
    createdAt: new Date().toISOString()
  }

  saveCache(data)

  return data
}