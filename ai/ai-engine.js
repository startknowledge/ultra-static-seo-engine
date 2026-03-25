import { CONFIG } from "../config.js"
import { generateFallback } from "../core/template-engine.js"

export async function runUnifiedAI(keywordData) {
  const { keyword } = keywordData

  // 🟢 AI OFF MODE
  if (!CONFIG.USE_AI) {
    console.log("⚡ AI OFF → using fallback")
    return generateFallback(keyword)
  }

  // 🔴 FUTURE AI MODE
  try {
    return await runGemini(keyword)
  } catch (e) {
    console.log("❌ AI failed → fallback")
    return generateFallback(keyword)
  }
}

// 🔌 future plugin
async function runGemini(keyword) {
  throw new Error("AI not enabled yet")
}