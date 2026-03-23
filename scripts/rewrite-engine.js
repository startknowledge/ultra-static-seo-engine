import fs from "fs"
import { generateWithAI } from "../ai/ai-engine.js"
import { STOP_AI } from "../config.js"

export async function rewriteContent(page) {
  if (STOP_AI.value) return

  const content = fs.readFileSync(page.page, "utf-8")

  const prompt = `
Improve this SEO article:
- Make it detailed
- Add FAQs
- Improve intro
- Add internal links

${content}
`

  try {
    const updated = await generateWithAI(prompt)
    fs.writeFileSync(page.page, updated)
    console.log("✍️ Rewritten:", page.page)
  } catch (e) {
    console.log("❌ Rewrite skipped:", e.message)
  }
}