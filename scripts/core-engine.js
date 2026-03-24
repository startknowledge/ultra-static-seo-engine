import fs from "fs"

import { GoogleGenerativeAI } from "@google/generative-ai"

// ================= IMPORTS =================
import { runRewriteEngine } from "./rewrite-engine.js"
import { runCTREngine } from "../core/ctr-engine.js"
import { runKeywordEvolution } from "../core/keyword-evolution.js"
import { runLearningEngine } from "../core/learning-engine.js"
import { runAuthorityEngine } from "../core/authority-engine.js"
import { runLinkEngineV2 } from "./link-engine-v2.js"
import { runRefreshEngine } from "./refresh-engine.js"

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

// SAFE ENGINE RUNNER (NO CRASH SYSTEM)
async function safeRun(name, fn) {
  try {
    console.log(`⚡ Running ${name}`)
    await fn()
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

// ================= AI GENERATOR =================
export async function generateAI(niche = "", keywords = [], existingSlugs = []) {
  if (API_KEYS.length === 0) {
    console.error("❌ No API Keys Found")
    return []
  }

  const prompt = `
Generate 3 SEO blog posts in JSON.

Niche: ${niche}
Keywords: ${keywords.join(",")}
Avoid: ${existingSlugs.join(",")}

Format:
[
{
"title":"",
"description":"",
"content":"<p>...</p>",
"keywords":[]
}
]

Rules:
- 1200+ words
- HTML only
- No markdown
`

  for (let i = 0; i < 5; i++) {
    try {
      const key = getRandom(API_KEYS)
      const modelName = getRandom(MODELS)

      console.log(`🤖 AI Try ${i + 1} | Model: ${modelName}`)

      const genAI = new GoogleGenerativeAI(key)
      const model = genAI.getGenerativeModel({ model: modelName })

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()

      let data
      try {
        data = JSON.parse(clean)
      } catch {
        console.log("⚠️ Invalid JSON from AI")
        continue
      }

      if (Array.isArray(data)) {
        console.log("✅ AI Content Generated")
        return data
      }

    } catch (e) {
      console.log(`⚠️ Retry ${i + 1}:`, e.message)
      await sleep(2000)
    }
  }

  console.log("❌ AI Failed")
  return []
}

// ================= PHASE 8 PROCESSOR =================
export async function processKeyword(keyword) {
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

// ================= PHASE 7 ENGINE =================
async function runPhase7() {
  console.log("\n🚀 PHASE 7: AI SELF LEARNING STARTED\n")

  try {
    // FAST PARALLEL TASKS
    await Promise.all([
      safeRun("Rewrite Engine", runRewriteEngine),
      safeRun("CTR Engine", runCTREngine),
      safeRun("Keyword Evolution", runKeywordEvolution)
    ])

    // SEQUENTIAL (IMPORTANT ORDER)
    await safeRun("Learning Engine", runLearningEngine)
    await safeRun("Authority Engine", runAuthorityEngine)

    // FINAL OPTIMIZATION
    await safeRun("Link Engine V2", runLinkEngineV2)
    await safeRun("Refresh Engine", runRefreshEngine)

    console.log("\n✅ PHASE 7 COMPLETED SUCCESSFULLY\n")

  } catch (err) {
    console.error("❌ PHASE 7 CRITICAL ERROR:", err)
  }
}

// ================= START =================
(async () => {
  try {
    await runPhase7()

    // ================= PHASE 8 EXECUTION =================
    const keywords = ["seo tips", "blogging 2026"]

    for (const kw of keywords) {
      const result = await processKeyword(kw)
      console.log("📊 Decision:", result)

      if (result?.decision === "PUBLISH") {
        console.log(`🚀 Generating content for: ${kw}`)

        const posts = await generateAI("seo", [kw])

        if (posts.length > 0) {
          savePosts(posts)
        }
      }
    }

  } catch (err) {
    console.error("❌ CORE ENGINE FAILED:", err.message)
  }
})()