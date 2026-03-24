import fs from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"

// ================= IMPORTS =================
import { runKeywordEvolution } from "../core/keyword-evolution.js"
import { runLearningEngine } from "../core/learning-engine.js"
import { runAuthorityEngine } from "../core/authority-engine.js"
import { runLinkEngineV2 } from "./link-engine-v2.js"

import { simulateRanking } from "../core/ranking-simulator.js"
import { predictTraffic } from "../core/traffic-predictor.js"
import { analyzeCompetition } from "../core/competition-analyzer.js"
import { analyzeSERP } from "../core/serp-analyzer.js"
import { decide } from "../core/decision-engine.js"

// ================= CONFIG =================
const MODELS = ["gemini-2.0-flash"]

const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
  process.env.GEMINI_API_KEY6
].filter(Boolean)

// ================= HELPERS =================
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ================= FALLBACK =================
function generateFallback(keyword) {
  return {
    title: `${keyword} - Complete Guide`,
    description: `Learn ${keyword} with this complete SEO guide.`,
    content: `
      <h1>${keyword}</h1>
      <p>This is auto-generated fallback SEO content.</p>
      <h2>Introduction</h2>
      <p>${keyword} is important for online growth.</p>
      <h2>Tips</h2>
      <ul>
        <li>Use proper keywords</li>
        <li>Create helpful content</li>
        <li>Optimize SEO</li>
      </ul>
      <h2>Conclusion</h2>
      <p>Follow these tips to improve ${keyword}.</p>
    `,
    keywords: [keyword]
  }
}

// ================= SAFE RUN =================
async function safeRun(name, fn) {
  try {
    console.log(`⚡ Running ${name}`)
    const result = await fn()

    if (result === null || result === false) {
      throw new Error("Empty result")
    }

    console.log(`✅ ${name} Completed`)
  } catch (err) {
    console.error(`❌ ${name} Failed:`, err.message)
  }
}

// ================= SAVE POSTS =================
function savePosts(posts) {
  const file = "data/posts.json"

  if (!fs.existsSync("data")) {
    fs.mkdirSync("data")
  }

  let existing = []
  if (fs.existsSync(file)) {
    existing = JSON.parse(fs.readFileSync(file, "utf-8"))
  }

  const updated = [...existing, ...posts]
  fs.writeFileSync(file, JSON.stringify(updated, null, 2))

  console.log(`💾 Saved ${posts.length} posts`)
}

// ================= UNIFIED AI ENGINE =================
async function runUnifiedAI(keyword) {
  const prompt = `
You are an advanced SEO AI.

Keyword: ${keyword}

Do all tasks:
1. Generate SEO blog post (1200+ words HTML)
2. Create high CTR title
3. Suggest keywords

Return JSON:
{
  "title": "",
  "description": "",
  "content": "<p>...</p>",
  "keywords": []
}
`

  if (API_KEYS.length === 0) {
    console.log("⚠️ No API Keys → Using fallback")
    return generateFallback(keyword)
  }

  for (let i = 0; i < 5; i++) {
    try {
      const key = getRandom(API_KEYS)
      const modelName = getRandom(MODELS)

      console.log(`🤖 AI Try ${i + 1}`)

      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel({ model: modelName })

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      const clean = text.replace(/```json|```/g, "").trim()
      const data = JSON.parse(clean)

      if (data?.content) {
        console.log("✅ Unified AI Success")
        return data
      }

    } catch (err) {
      console.log(`⚠️ Retry ${i + 1}:`, err.message)
      await sleep(8000) // delay increase
    }
  }

  console.log("❌ AI Failed → Using fallback")
  return generateFallback(keyword)
}

// ================= PHASE 8 =================
async function processKeyword(keyword) {
  try {
    const competition = analyzeCompetition(keyword)
    const serp = analyzeSERP(keyword)

    const ranking = simulateRanking({
      keyword,
      contentLength: 1200,
      domainAuthority: 20,
      backlinks: 5,
      seoScore: 80
    })

    const traffic = predictTraffic({
      searchVolume: 5000,
      position: ranking.estimatedPosition
    })

    const decision = decide({
      difficulty: competition.difficulty,
      estimatedTraffic: traffic.estimatedTraffic,
      position: ranking.estimatedPosition
    })

    return {
      keyword,
      ...competition,
      ...ranking,
      ...traffic,
      serp,
      decision
    }

  } catch (err) {
    console.error("❌ processKeyword Error:", err.message)
    return null
  }
}

// ================= PHASE 7 =================
async function runPhase7() {
  console.log("\n🚀 PHASE 7 STARTED\n")

  await safeRun("Keyword Evolution", runKeywordEvolution)
  await safeRun("Learning Engine", runLearningEngine)
  await safeRun("Authority Engine", runAuthorityEngine)
  await safeRun("Link Engine V2", runLinkEngineV2)

  console.log("\n✅ PHASE 7 COMPLETED\n")
}

// ================= START =================
(async () => {
  try {
    await runPhase7()

    const keywords = ["seo tips", "blogging 2026"]

    for (const kw of keywords) {
      const result = await processKeyword(kw)
      console.log("📊 Decision:", result)

      if (
        result?.decision === "PUBLISH" ||
        result?.estimatedTraffic >= 20
      ) {
        console.log(`🚀 Generating content: ${kw}`)

        const aiData = await runUnifiedAI(kw)

        // ✅ ALWAYS SAVE (even fallback)
        if (aiData) {
          savePosts([aiData])
        }

        await sleep(5000)
      }
    }

  } catch (err) {
    console.error("❌ CORE ENGINE FAILED:", err.message)
  }
})()