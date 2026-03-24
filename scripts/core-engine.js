import { GoogleGenerativeAI } from "@google/generative-ai"

// ================= IMPORTS =================
import { runRewriteEngine } from "./rewrite-engine.js"
import { runCTREngine } from "../core/ctr-engine.js"
import { runKeywordEvolution } from "../core/keyword-evolution.js"
import { runLearningEngine } from "../core/learning-engine.js"
import { runAuthorityEngine } from "../core/authority-engine.js"
import { runLinkEngineV2 } from "./link-engine-v2.js"
import { runRefreshEngine } from "./refresh-engine.js"

// ================= CONFIG =================
const MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"]

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
  return new Promise(r => setTimeout(r, ms))
}

// ================= AI GENERATOR =================
export async function generateAI(niche = "", keywords = [], existingSlugs = []) {
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

      const data = JSON.parse(clean)

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

// ================= PHASE 7 ENGINE =================
async function runPhase7() {
  console.log("\n🚀 PHASE 7: AI SELF LEARNING STARTED\n")

  try {

    // PARALLEL EXECUTION (FAST)
    await Promise.all([
      runRewriteEngine(),
      runCTREngine(),
      runKeywordEvolution()
    ])

    // SEQUENTIAL (DEPENDENT SYSTEMS)
    await runLearningEngine()
    await runAuthorityEngine()

    // FINAL OPTIMIZATION
    await runLinkEngineV2()
    await runRefreshEngine()

    console.log("\n✅ PHASE 7 COMPLETED SUCCESSFULLY\n")

  } catch (err) {
    console.error("❌ PHASE 7 ERROR:", err)
  }
}

// ================= START =================
runPhase7()