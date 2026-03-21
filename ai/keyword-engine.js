import { generateAI } from "../core/ai-engine.js"

export async function expand(keyword) {
  const prompt = `
Generate 15 SEO keywords for:
${keyword}
`

  const res = await generateAI(prompt)

  return res.split("\n").filter(Boolean)
}