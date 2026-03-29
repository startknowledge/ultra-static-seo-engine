import fs from "fs"
import { SITE_CONFIG } from "../config/site-config.js"

export function render(templatePath, data) {

  const GLOBALS = {
    ...SITE_CONFIG,
    year: new Date().getFullYear()
  }

  const finalData = { ...GLOBALS, ...data }

  let html = fs.readFileSync(templatePath, "utf8")

  // 🔥 layout inject
  if (html.includes("{{layout}}")) {
    const layout = fs.readFileSync("templates/layout.html", "utf8")
    html = html.replace("{{layout}}", layout)
  }

  // 🔥 REPLACE ALL KEYS (IMPORTANT FIX)
  for (const key in finalData) {
    html = html.replaceAll(`{{${key}}}`, finalData[key])
  }

  // 🔥 remove leftover variables
  html = html.replace(/{{(.*?)}}/g, "")

  return html
}

// ✅ FALLBACK
export function generateFallback(keyword) {

  const title = `${keyword} - Ultimate Guide 2026`

  const content = `
<h1>${keyword}</h1>

<p>${keyword} is trending right now.</p>

<h2>Latest insights on ${keyword}</h2>
<p>People are searching for ${keyword} due to current trends.</p>

<h2>Why ${keyword} is popular</h2>
<p>This topic is gaining attention globally.</p>

<h2>Conclusion</h2>
<p>${keyword} is worth exploring.</p>`

  return {
    title,
    description: `Complete guide about ${keyword}`,
    content,
    keywords: [keyword]
  }
}