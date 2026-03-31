import fs from "fs"
import { injectAds } from "../engine/monetization-engine.js"
import { generateSmartContent } from "../ai/hybrid-engine.js"

function safeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // ❌ remove invalid chars
    .replace(/\s+/g, "-")
}

export async function generateBlogs(strategy, context) {
  const blogs = []

  if (!fs.existsSync("./docs")) fs.mkdirSync("./docs")

  for (const keyword of strategy.cluster) {

    let content = await generateSmartContent(
      `Write SEO blog about "${keyword}"`,
      keyword
    )

    if (!content) continue

    const slug = safeSlug(keyword)   // ✅ FIXED
    const url = `${context.domain}/${slug}.html`


    // 🌐 HTML TEMPLATE (NO AFFILIATE)
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${keyword}</title>
<meta name="description" content="Complete guide about ${keyword}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="${url}">
</head>

<body>

<!-- build-id: ${unique} -->

<h1>${keyword}</h1>

${content}

<div style="margin-top:40px;padding:20px;background:#111;color:#fff;text-align:center;">
<h2>🚀 Keep Exploring</h2>
<p>Discover more insights about ${keyword} and related topics.</p>
</div>

</body>
</html>
`

    // 💰 ADS INJECTION (AI BASED)
    html = injectAds(html)

    fs.writeFileSync(`./docs/${slug}.html`, html)

    blogs.push({
      slug,
      keyword,
      url,
      date: new Date().toISOString()
    })

    console.log("✅ Blog:", slug)
  }

  return blogs
}