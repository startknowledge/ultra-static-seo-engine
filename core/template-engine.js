import fs from "fs"

// ✅ RENDER ENGINE (FINAL)
export function render(templatePath, data) {

  const GLOBALS = {
    SITE_URL: process.env.SITE_URL || "https://ultrastaticseoengine.startknowledge.in",
    SITE_NAME: "StartKnowledge",
    SITE_LANG: "en",
    year: new Date().getFullYear()
  }

  const finalData = { ...GLOBALS, ...data }

  let html = fs.readFileSync(templatePath, "utf8")

  // 🔥 safe replace (no undefined issue)
  html = html.replace(/{{(.*?)}}/g, (_, key) => {
    return finalData[key.trim()] ?? ""
  })

  return html
}

// ✅ FALLBACK
export function generateFallback(keyword) {

  const title = `${keyword} - Ultimate Guide 2026`

  const content = `
  <h1>${keyword}</h1>

  <p>${keyword} is trending topic in 2026.</p>

  <h2>What is ${keyword}?</h2>
  <p>${keyword} explained in simple terms.</p>

  <h2>Benefits of ${keyword}</h2>
  <ul>
    <li>Increase traffic</li>
    <li>Improve SEO ranking</li>
    <li>Better monetization</li>
  </ul>

  <h2>FAQs</h2>
  <p><b>Is ${keyword} important?</b> Yes.</p>

  <h2>Conclusion</h2>
  <p>${keyword} is powerful strategy.</p>
  `

  return {
    title,
    description: `Complete guide about ${keyword}`,
    content,
    keywords: [keyword]
  }
}