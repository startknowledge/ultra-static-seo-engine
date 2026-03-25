import { CONFIG, STOP_AI } from "../config.js"
import { generateFallback } from "../core/template-engine.js"
import { GoogleGenerativeAI } from "@google/generative-ai"

// 🔑 API KEYS (only 2 use karenge)
const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

// 🔢 usage tracker
let AI_CALL_COUNT = 0

function getKey() {
  return API_KEYS[AI_CALL_COUNT % API_KEYS.length]
}

// ================= MAIN =================
export async function runUnifiedAI(keywordData) {
  const { keyword } = keywordData

  // ❌ AI OFF
  if (!CONFIG.USE_AI || STOP_AI.value) {
    console.log("⚡ AI OFF → fallback")
    return generateFallback(keyword)
  }

  // ❌ LIMIT REACHED
  if (AI_CALL_COUNT >= CONFIG.MAX_AI_CALLS) {
    console.log("🛑 AI LIMIT REACHED → fallback")
    STOP_AI.value = true
    return generateFallback(keyword)
  }

  try {
    console.log("🤖 AI generating:", keyword)

    const result = await runGemini(keyword)

    AI_CALL_COUNT++

    console.log(`✅ AI USED: ${AI_CALL_COUNT}/${CONFIG.MAX_AI_CALLS}`)

    return result

  } catch (e) {
    console.log("❌ AI failed:", e.message)
    return generateFallback(keyword)
  }
}

// ================= GEMINI =================
async function runGemini(keyword) {

  const genAI = new GoogleGenerativeAI(getKey())

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  })

  const prompt = `
Write a high quality SEO blog on: ${keyword}

Requirements:
- 2000+ words
- HTML format
- Use headings, lists
- SEO optimized
- Human tone
`

  const result = await model.generateContent(prompt)

  const text = result.response.text()

  return {
    title: `${keyword} - Complete Guide 2026`,
    description: `Learn ${keyword} in detail`,
    content: text,
    keywords: [keyword]
  }
}