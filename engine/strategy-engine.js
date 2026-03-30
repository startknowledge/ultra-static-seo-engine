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

    return list[Math.floor(Math.random() * list.length)]
  } catch {
    return null
  }
}

// 📂 REPO CONTENT → KEYWORD
function detectFromRepo(repoName) {
  const files = fs.readdirSync("./", { recursive: true })

  const joined = files.join(" ").toLowerCase()

  if (joined.includes("calculator")) return "online calculator"
  if (joined.includes("seo")) return "seo optimization"
  if (joined.includes("ai")) return "ai tools"
  if (joined.includes("design")) return "design tools"
  if (joined.includes("ration")) return "ration calculation"

  return repoName.replace(/-/g, " ")
}

// 🤖 GEMINI
async function generateCluster(seed) {
  const key = getKey()
  if (!key) return []

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        contents: [{
          parts: [{ text: `Generate search queries for "${seed}"` }]
        }]
      }
    )

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return text.split("\n").map(x => x.trim()).filter(Boolean)

  } catch {
    console.log("⚠️ Gemini failed")
    return []
  }
}

// 🚀 MAIN
export async function runStrategy(repoName = "") {
  console.log("🧠 AI STRATEGY")

  const db = loadDB()

  let seed = await getTrend()

  if (!seed) {
    seed = detectFromRepo(repoName)
    console.log("📂 Repo-based seed:", seed)
  }

  if (!seed && db.length) {
    seed = db[Math.floor(Math.random() * db.length)]
  }

  if (!seed) {
    return { niche: null, cluster: [] }
  }

  console.log("🌐 SEED:", seed)

  let cluster = await generateCluster(seed)

  if (!cluster.length) {
    cluster = [seed]
  }

  cluster = [...new Set(cluster.map(x => x.toLowerCase()))]

  saveDB([...new Set([...db, ...cluster])])

  return {
    niche: seed,
    cluster
  }
}