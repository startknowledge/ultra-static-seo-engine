import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { SETTINGS } from "../config/settings.js"
import { injectAds } from "../engine/monetization-engine.js"

export async function generateBlogs(strategy) {
  const blogs = []
  const unique = Date.now()

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    // 🔥 PURE DYNAMIC AI CONTENT (NO TEMPLATE)
    let content = await generateAIContent(`
Create a detailed, informative, and engaging article about "${keyword}".
Make it helpful for users searching this topic.
`)
if (!content) {
  console.log("⚠️ Empty AI content → skipping blog")
  continue
}

    const slug = keyword.replace(/\s+/g, "-").toLowerCase()

    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${keyword} | ${SETTINGS.siteName}</title>
<meta name="description" content="Latest insights on ${keyword}">
<link rel="canonical" href="${SETTINGS.domain}/${slug}.html">

<style>
body { font-family: Arial; margin: 20px; }
.cta { background:#000;color:#fff;padding:20px;text-align:center;margin:30px 0 }
</style>
</head>

<body>

<!-- build-id: ${unique} -->
<!-- build-id: ${Date.now()} -->

<h1>${keyword}</h1>

<a href="https://example.com?ref=seo-engine" target="_blank">
🔥 Explore ${keyword}
</a>

${content}

<div class="cta">
<h2>🚀 Take Action Now</h2>
<a href="https://example.com?ref=seo-engine" target="_blank" style="color:#fff;">
Get Started
</a>
</div>

</body>
</html>
`

    // 🔥 ADS INJECTION ONLY HERE
    html = injectAds(html)

    fs.writeFileSync(`./dist/${slug}.html`, html)

    console.log("✅ Blog Created:", slug)

    blogs.push({
      slug,
      keyword,
      url: `${SETTINGS.domain}/${slug}.html`
    })
  }

  return blogs
}