import { generateWithAI } from "../ai/ai-engine.js"
import { STOP_AI } from "../config.js"

export async function optimizeCTR(title) {
  if (STOP_AI.value) return title

  const prompt = `Make this title highly clickable and SEO optimized: ${title}`

  try {
    return await generateWithAI(prompt)
  } catch {
    return title
  }
}