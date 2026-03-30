import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { SETTINGS } from "../config/settings.js"

// 🔥 IMPORT ADS ENGINE
import { injectAds } from "../engine/monetization-engine.js"

export async function generateBlogs(strategy) {
  const blogs = []
  const unique = Date.now()

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    // 🔥 AI CONTENT
    let content = await generateAIContent(`
Write a HIGH CONVERTING SEO blog on "${keyword}"

Include:
- Introduction
- Best tools/products
- Pros & Cons
- Pricing
- FAQ
- Conclusion with CTA

Use persuasive tone
`)

    // 🔥 SLUG
    const slug = keyword.replace(/\s+/g, "-").toLowerCase()

    // 🔥 BASE HTML (NO ADS HERE)
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<title>${keyword} | ${SETTINGS.siteName}</title>

<meta name="description" content="Latest guide on ${keyword}">
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="canonical" href="${SETTINGS.domain}/${slug}.html">

<style>
body { font-family: Arial; margin: 20px; line-height: 1.6; }
h1 { color: #111; }
.cta { background:#000;color:#fff;padding:20px;text-align:center;margin:30px 0 }
.box { background:#f4f4f4;padding:15px;margin:20px 0 }
</style>

</head>

<body>

<!-- 🔥 UNIQUE BUILD -->
<!-- build-id: ${unique} -->

<h1>${keyword}</h1>

<div class="box">
<b>🔥 Best Deal:</b><br>

<a href="https://example.com?ref=seo-engine" target="_blank">
👉 Buy Best ${keyword}
</a>
</div>

${content}

<!-- 🔥 CTA -->
<div class="cta">
<h2>🚀 Start Now</h2>

<a href="https://example.com?ref=seo-engine" target="_blank" style="color:#fff;">
Click Here to Get Best ${keyword}
</a>
</div>

</body>
</html>
`

    // 🔥 APPLY ADS ENGINE (MAIN MAGIC)
    html = injectAds(html)

    // 🔥 SAVE FILE
    fs.writeFileSync(`./dist/${slug}.html`, html)

    console.log("✅ Blog Created:", slug)

    blogs.push({
      slug,
      keyword,
      url: `${SETTINGS.domain}/${slug}.html`,
      date: new Date().toISOString()
    })
  }

  return blogs
}