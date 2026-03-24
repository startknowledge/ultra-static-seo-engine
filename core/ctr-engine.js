import { GoogleGenerativeAI } from "@google/generative-ai"
import { STOP_AI } from "../config.js"

// 🔑 ALL API KEYS
const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
  process.env.GEMINI_API_KEY6
].filter(Boolean)

// 🎯 RANDOM KEY SELECTOR
function getRandomKey() {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)]
}

// ================= CTR OPTIMIZER =================
export async function optimizeCTR(title) {
  if (STOP_AI.value) return title

  try {
    const genAI = new GoogleGenerativeAI(getRandomKey())
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    })

    const prompt = `
Make this title highly clickable and SEO optimized.

Title: ${title}

Give 3 variations.
`

    const result = await model.generateContent(prompt)
    return result.response.text()

  } catch (e) {
    console.log("❌ CTR optimize failed:", e.message)
    return title
  }
}

// ================= ENGINE RUNNER =================
export async function runCTREngine(){
  console.log("📊 CTR Engine Running...")

  if (STOP_AI.value) return

  try {
    const genAI = new GoogleGenerativeAI(getRandomKey())
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    })

    const prompt = `
Improve CTR for blog titles and meta descriptions.

Give:
- 3 titles
- 3 meta descriptions
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    console.log("📈 CTR Suggestions:\n", text)

  } catch(e){
    console.log("❌ CTR Engine failed:", e.message)
  }
}