import { CONFIG, STOP_AI } from "../config.js"
import { generateFallback } from "../core/template-engine.js"

import { generateWithGemini } from "./providers/gemini.js"
import { generateWithOpenAI } from "./providers/openai.js"
import { generateWithClaude } from "./providers/claude.js"

// 🔑 API KEYS (GEMINI ROTATION)
const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

let keyIndex = 0
let usagePerKey = Array(API_KEYS.length).fill(0)

const LIMIT_PER_KEY = 5

function getNextKey() {

  if (API_KEYS.length === 0) return null

  if (usagePerKey[keyIndex] >= LIMIT_PER_KEY) {
    keyIndex = (keyIndex + 1) % API_KEYS.length
  }

  usagePerKey[keyIndex]++

  console.log(`🔑 Using KEY ${keyIndex + 1} (${usagePerKey[keyIndex]}/${LIMIT_PER_KEY})`)

  return API_KEYS[keyIndex]
}

// ================= MAIN =================
export async function runUnifiedAI(keywordData) {

  const { keyword } = keywordData

  if (!CONFIG?.USE_AI || STOP_AI?.value) {
    console.log("⚡ AI OFF → fallback")
    return generateFallback(keyword)
  }

  // 🔥 TRY 1: GEMINI (WITH KEY ROTATION)
  try {
    console.log("🧠 Using Gemini")

    const apiKey = getNextKey()

    return await generateWithGemini(keywordData, apiKey)

  } catch (e) {
    console.log("⚠️ Gemini failed")
  }

  // 🔥 TRY 2: OPENAI
  try {
    console.log("🧠 Using OpenAI")
    return await generateWithOpenAI(keywordData)
  } catch (e) {
    console.log("⚠️ OpenAI failed")
  }

  // 🔥 TRY 3: CLAUDE
  try {
    console.log("🧠 Using Claude")
    return await generateWithClaude(keywordData)
  } catch (e) {
    console.log("⚠️ Claude failed")
  }

  // ❌ ALL FAILED → FALLBACK
  console.log("❌ All AI failed → fallback")

  return generateFallback(keyword)
}