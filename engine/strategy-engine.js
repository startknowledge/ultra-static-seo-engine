import fs from "fs"
import axios from "axios"

const DB = "./data/keyword-db.json"

// 🔑 API CONFIG (FIXED)
const API_CONFIG = [
{ key: process.env.GEMINI_API_KEY1, type: "gemini" },
{ key: process.env.GEMINI_API_KEY2, type: "gemini" },
{ key: process.env.GEMINI_API_KEY3, type: "gemini" },
{ key: process.env.GEMINI_API_KEY4, type: "gemini" },

{ key: process.env.GROQ_API1, type: "groq" },
{ key: process.env.OPENAI_OPENROUTER1, type: "openrouter" },
{ key: process.env.HUGGINGFACE_TOKEN1, type: "huggingface" }
].filter(x => x.key)

let index = 0
function getNextAPI() {
if (API_CONFIG.length === 0) return null
const api = API_CONFIG[index % API_CONFIG.length]
index++
return api
}

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

// 🌐 GOOGLE TREND (FAST + SAFE)
async function getTrend() {
try {
const res = await axios.get("https://trends.google.com/trending/rss?geo=IN")
const xml = res.data

const matches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]

const list = matches
  .map(m => m[1])
  .filter(k => k && k !== "Daily Search Trends")

return list.length
  ? list[Math.floor(Math.random() * list.length)]
  : null

} catch {
console.log("⚠️ Trend fetch failed")
return null
}
}

// 🔥 AI CLUSTER (MULTI API)
async function generateCluster(seed) {
for (let i = 0; i < API_CONFIG.length; i++) {
const api = getNextAPI()
if (!api) continue

console.log("🔑 Strategy using:", api.type)

try {
  // GEMINI
  if (api.type === "gemini") {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${api.key}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Generate 10 SEO keywords for "${seed}" in clean list`
              }
            ]
          }
        ]
      }
    )

    const text =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (text) return cleanKeywords(text)
  }

  // GROQ
  if (api.type === "groq") {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: `Generate SEO keywords for "${seed}" as list`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${api.key}`
        }
      }
    )

    const text = res.data?.choices?.[0]?.message?.content
    if (text) return cleanKeywords(text)
  }

  // OPENROUTER
  if (api.type === "openrouter") {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Generate SEO keywords for "${seed}" as list`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${api.key}`
        }
      }
    )

    const text = res.data?.choices?.[0]?.message?.content
    if (text) return cleanKeywords(text)
  }

  // HUGGINGFACE
  if (api.type === "huggingface") {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct",
      { inputs: `SEO keywords for ${seed}` },
      {
        headers: {
          Authorization: `Bearer ${api.key}`
        }
      }
    )

    const text = res.data?.[0]?.generated_text
    if (text) return cleanKeywords(text)
  }

} catch (err) {
  console.log("⚠️ Strategy API failed:", api.type)
}

}

return []
}

// 🧹 CLEAN
function cleanKeywords(text) {
return text
.split("\n")
.map(k => k.replace(/^\d+[).-\s]*/, "").trim())
.filter(k => k.length > 2)
.slice(0, 10)
}

// 🚀 MAIN
export async function runStrategy(context) {
console.log("🧠 AI STRATEGY")

const db = loadDB()

// 🔥 1. Trend first
let seed = await getTrend()

// 🔥 2. fallback
if (!seed) {
seed = context.niche
console.log("📂 Repo fallback:", seed)
}

console.log("🌐 SEED:", seed)

// 🔥 3. cluster
let cluster = await generateCluster(seed)

if (!cluster.length) {
console.log("⚠️ AI failed → using seed")
cluster = [seed]
}

cluster = [...new Set(cluster.map(k => k.toLowerCase()))]

const updatedDB = [...new Set([...db, ...cluster])]
saveDB(updatedDB)

return {
niche: seed,
cluster,
createdAt: new Date().toISOString()
}
}
