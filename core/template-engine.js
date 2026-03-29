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

export function generateFallback(keyword) {

  const title = `${keyword} - Latest Update ${new Date().getFullYear()}`

  const content = `
  <h1>${keyword}</h1>

  <p>${keyword} is currently trending and gaining massive attention.</p>

  <h2>What is happening in ${keyword}?</h2>
  <p>Latest developments around ${keyword} are driving search traffic.</p>

  <h2>Why people are searching ${keyword}</h2>
  <p>This topic is trending due to recent updates and public interest.</p>

  <h2>Conclusion</h2>
  <p>${keyword} is one of the most searched topics right now.</p>
  `

  return {
    title,
    description: `Latest news and updates about ${keyword}`,
    content
  }
}