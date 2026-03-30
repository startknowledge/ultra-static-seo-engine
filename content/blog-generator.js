import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { injectAds } from "../engine/monetization-engine.js"

export async function generateBlogs(strategy, context) {
  const blogs = []
  const unique = Date.now()

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    let content = await generateAIContent(`
Write a detailed SEO optimized blog post about "${keyword}".
Make it helpful and user-focused.
`)

    if (!content) {
      console.log("⚠️ Empty content → skip")
      continue
    }

    const slug = keyword.replace(/\s+/g, "-").toLowerCase()
    const url = `${context.domain}/${slug}.html`

    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${keyword}</title>
<meta name="description" content="Latest insights on ${keyword}">
<link rel="canonical" href="${url}">
</head>

<body>

<!-- build-id: ${unique} -->

<h1>${keyword}</h1>

<!-- 🔥 Affiliate -->
<a href="https://example.com?ref=seo-engine" target="_blank">
🔥 Explore ${keyword}
</a>

${content}

<div style="margin-top:30px;padding:20px;background:#000;color:#fff;text-align:center;">
<h2>🚀 Take Action</h2>
<a href="https://example.com?ref=seo-engine" target="_blank" style="color:#fff;">
Get Started
</a>
</div>

</body>
</html>
`

    // 🔥 ADS ENABLED
    html = injectAds(html)

    fs.writeFileSync(`./dist/${slug}.html`, html)

    console.log("✅ Blog:", url)

    blogs.push({
      slug,
      keyword,
      url
    })
  }

  return blogs
}