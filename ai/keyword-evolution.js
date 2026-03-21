import { generateAI } from "../core/ai-engine.js"

export async function evolveKeywords(keyword) {
  const prompt = `
Generate 20 SEO keywords for:
${keyword}
`

  const res = await generateAI(prompt)

  return res.split("\n").filter(Boolean)
}