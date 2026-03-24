import fs from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { STOP_AI } from "../config.js"

// ================= API POOL =================
const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
  process.env.GEMINI_API_KEY6
].filter(Boolean)

function getRandom(arr){
  return arr[Math.floor(Math.random() * arr.length)]
}

// ================= REWRITE =================
export async function rewriteContent(page) {
  if (STOP_AI.value) return

  const content = fs.readFileSync(page.page, "utf-8")

  const prompt = `
Rewrite this SEO article in better way:

- Improve readability
- Add FAQs
- Improve intro
- Add internal links
- Keep HTML format
- DO NOT return JSON

Content:
${content}
`

  try {
    const key = getRandom(API_KEYS)

    console.log("🤖 Using API:", key?.slice(0,10), "...")

    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    fs.writeFileSync(page.page, text)

    console.log("✍️ Rewritten:", page.page)

  } catch (e) {
    console.log("❌ Rewrite failed:", e.message)
  }
}

// ================= RUN =================
export async function runRewriteEngine(){
  console.log("✍️ Rewrite Engine Running...")

  const pages = [
    { page: "index.html" }
  ]

  for (const p of pages) {
    await rewriteContent(p)
  }
}