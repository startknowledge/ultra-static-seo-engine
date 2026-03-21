import { generateAI } from "../core/ai-engine.js"

export async function translate(content, lang) {
  const prompt = `Translate to ${lang}:\n${content}`

  return await generateAI(prompt)
}