import { generateBlog } from "./generator-blog.js"
import { fetchTrends } from "./trend-engine.js"

// 🔥 detect repo niche
function detectNiche() {
  const repo = process.env.GITHUB_REPOSITORY || "seo-engine"
  
  if (repo.includes("seo")) return "seo"
  if (repo.includes("crypto")) return "crypto"
  if (repo.includes("ai")) return "ai tools"
  if (repo.includes("health")) return "health"
  
  return "blogging"
}

// 🔥 modifiers
const modifiers = [
 "how to","best","top","free","latest","guide","2026",
"fast","easy","complete","advanced","strategy","tips",
"tutorial","tools","software","platform","course",

"review","comparison","vs","alternatives","examples",
"ideas","checklist","framework","methods","techniques",
"hacks","secrets","pro","expert","beginner","starter",
"step by step","case study","templates","resources",
"services","solutions","systems","automation","workflow",
"setup","installation","configuration","optimization",
"improvement","growth","scaling","performance","analysis",
"insights","trends","updates","news","future",
"pricing","cost","budget","cheap","premium",
"features","benefits","pros and cons","limitations",
"use cases","applications","industries","niche",
"tools list","software list","platform list",
"course free","course online","certification",
"download","free download","demo","trial",
"best practices","mistakes","errors","fix","troubleshooting"
]

// 🔥 keyword generator
function generateKeywords(niche) {
  return modifiers.map(m => ({
    keyword: `${m} ${niche}`,
    traffic: Math.floor(Math.random() * 100)
  }))
}

// 🚀 MAIN RUN
async function run() {

  // ✅ fetch trends FIRST
  await fetchTrends()

  const niche = detectNiche()
  console.log("🎯 Niche:", niche)

  const keywords = generateKeywords(niche)

  for (const k of keywords) {

    if (k.traffic < 20) continue

    console.log("🚀 Generating:", k.keyword)

    await generateBlog(k)
  }
}

run()