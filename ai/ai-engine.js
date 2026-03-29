import { CONFIG, STOP_AI } from "../config.js"
import { generateFallback } from "../core/template-engine.js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { generateWithGemini } from "./providers/gemini.js"
import { generateWithOpenAI } from "./providers/openai.js"
import { generateWithClaude } from "./providers/claude.js"

export async function runUnifiedAI(keywordData) {

  // 🔥 TRY 1: GEMINI
  try {
    console.log("🧠 Using Gemini")
    return await generateWithGemini(keywordData)
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

  // ❌ ALL FAILED
  throw new Error("All AI providers failed")
}

// 🔑 API KEYS
const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

let keyIndex = 0
let usagePerKey = Array(API_KEYS.length).fill(0)

const LIMIT_PER_KEY = 5 // 🔥 SAFE LIMIT

function getNextKey() {

  // 🔁 rotate if limit hit
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

  if (!CONFIG.USE_AI || STOP_AI.value) {
    console.log("⚡ AI OFF → fallback")
    return generateFallback(keyword)
  }

  try {

    const apiKey = getNextKey()

    console.log("🤖 AI generating:", keyword)

    const result = await runGemini(keyword, apiKey)

    return result

  } catch (e) {

    console.log("⚠️ Retry with next key...")

    try {
      keyIndex = (keyIndex + 1) % API_KEYS.length
      const retryKey = getNextKey()
      return await runGemini(keyword, retryKey)
    } catch (err) {
      console.log("❌ AI failed completely")
      return generateFallback(keyword)
    }
  }
}

// ================= GEMINI =================
async function runGemini(keyword, apiKey) {

  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  })

  const prompt = `
Write a high quality SEO blog on: ${keyword}

- 1500+ words
- HTML format
- SEO optimized
- human tone
`

  const result = await model.generateContent(prompt)

  const text = result.response.text()

  return {
    title: `${keyword} - Complete Guide`,
    description: `Learn ${keyword}`,
    content: text,
    keywords: [keyword]
  }
}