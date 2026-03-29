import fs from "fs"
import axios from "axios"

// ================= CONFIG =================
const CACHE_PATH = "./data/trends-cache.json"
const USAGE_PATH = "./data/serp-usage.json"
const KEYWORD_DB_PATH = "./data/keyword-db.json"

// ================= KEYS =================
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

const SERP_KEYS = [
  process.env.SERP_API_KEY1
].filter(Boolean)

// ================= ROTATION =================
let gIndex = 0
let sIndex = 0

const getGeminiKey = () => GEMINI_KEYS[gIndex++ % GEMINI_KEYS.length]
const getSerpKey = () => SERP_KEYS[sIndex++ % SERP_KEYS.length]

// ================= FILE UTILS =================
const ensureDataDir = () => {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data")
}

const readJSON = (path, fallback) => {
  try {
    if (!fs.existsSync(path)) return fallback
    return JSON.parse(fs.readFileSync(path))
  } catch {
    return fallback
  }
}

const writeJSON = (path, data) => {
  ensureDataDir()
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

// ================= LOCAL DB =================
const loadKeywordDB = () => readJSON(KEYWORD_DB_PATH, [])

const saveKeywordDB = (db) => writeJSON(KEYWORD_DB_PATH, db)

const getLocalKeyword = () => {
  const db = loadKeywordDB()
  return db.length
    ? db[Math.floor(Math.random() * db.length)]
    : "seo tips"
}

// ================= CACHE =================
const loadCache = () => readJSON(CACHE_PATH, null)

const saveCache = (data) => writeJSON(CACHE_PATH, data)

const isExpired = (cache) =>
  Date.now() - new Date(cache.createdAt) > 12 * 60 * 60 * 1000

// ================= USAGE =================
const getUsage = () => {
  const data = readJSON(USAGE_PATH, null)
  const month = new Date().getMonth()

  if (!data || data.month !== month) {
    return { count: 0, month }
  }

  return data
}

const saveUsage = (data) => writeJSON(USAGE_PATH, data)

// ================= GEMINI =================
async function getGeminiTrend() {
  if (!GEMINI_KEYS.length) return getLocalKeyword()

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${getGeminiKey()}`,
      {
        contents: [{ parts: [{ text: "Give 1 trending SEO keyword for 2026" }] }]
      }
    )

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.split("\n")[0]
      || getLocalKeyword()
  } catch {
    return getLocalKeyword()
  }
}

// ================= SERP =================
async function getSerpTrend() {
  if (!SERP_KEYS.length) return getLocalKeyword()

  try {
    const res = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_trends",
        geo: "IN",
        api_key: getSerpKey()
      }
    })

    const trends = res.data?.trending_searches_days?.[0]?.trending_searches || []

    if (!trends.length) throw new Error()

    const random = trends[Math.floor(Math.random() * trends.length)]
    return random?.title?.query || getLocalKeyword()
  } catch {
    return getLocalKeyword()
  }
}

// ================= EXPAND =================
async function expandKeywords(seed) {
  if (!GEMINI_KEYS.length) return

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${getGeminiKey()}`,
      {
        contents: [{ parts: [{ text: `Generate 5 SEO keywords for ${seed}` }] }]
      }
    )

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const newKeywords = text
      .split("\n")
      .map(k => k.replace(/^\d+\. /, "").trim())
      .filter(Boolean)

    const updated = [...new Set([...loadKeywordDB(), ...newKeywords])]
    saveKeywordDB(updated)

  } catch {
    console.log("❌ Expand failed")
  }
}

// ================= MAIN =================
export async function runStrategy() {
  console.log("🧠 Strategy Engine Start")

  const cache = loadCache()
  if (cache && !isExpired(cache)) {
    console.log("⚡ CACHE USED")
    return cache
  }

  const usage = getUsage()

  let keyword

  if (usage.count < 30) {
    console.log("🌐 SERP MODE")
    keyword = await getSerpTrend()
    usage.count++
    saveUsage(usage)
  } else if (usage.count < 90) {
    console.log("🤖 AI MODE")
    keyword = await getGeminiTrend()
  } else {
    console.log("📦 LOCAL MODE")
    keyword = getLocalKeyword()
  }

  await expandKeywords(keyword)

  const data = {
    niche: keyword,
    cluster: [keyword],
    createdAt: new Date().toISOString()
  }

  saveCache(data)

  return data
}