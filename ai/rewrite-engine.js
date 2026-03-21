import { generateAI } from "../core/ai-engine.js"

export async function rewrite(html) {
  const prompt = `
Improve SEO + remove spam + better structure:

${html}

Return CLEAN HTML only.
`

  return await generateAI(prompt)
}