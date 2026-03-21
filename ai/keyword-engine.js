import { generateAI } from "../core/ai-engine.js"

export async function expand(niche) {

  const prompt = `Generate 20 SEO keywords related to ${niche}. Return only keywords in list format.`

  const model = generateAI()

  try {
    const result = await model.generateContent(prompt)

    const text = result?.response?.text?.()

    if (!text || typeof text !== "string") {
      console.log("❌ Invalid AI response:", text)
      return []
    }

    return text
      .split("\n")
      .map(x => x.replace(/^[0-9.\- ]+/, "").trim()) // clean numbering
      .filter(Boolean)

  } catch (err) {
    console.log("❌ AI error:", err.message)
    return []
  }
}