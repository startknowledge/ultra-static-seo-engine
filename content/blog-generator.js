import fs from "fs"
import { generateWithRetry } from "../ai/ai-engine.js"
import { injectAds } from "../engine/monetization-engine.js"
import { injectAffiliateLinks, generateAffiliateLink } from "../engine/affiliate-engine.js"
import { getBuyerKeywords } from "../engine/strategy-engine.js"

export async function generateBlogs(strategy, context) {
  const blogs = []
  const unique = Date.now()

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    // 🤖 AI WITH RETRY
    let content = await generateWithRetry(`
Write a detailed SEO optimized blog post about "${keyword}".
Make it helpful, actionable and include buying suggestions if relevant.
`)

    if (!content) {
      console.log("⚠️ Empty content → skip")
      continue
    }

    // 🧠 BUYER KEYWORDS AUTO
    const buyerKeywords = getBuyerKeywords(strategy.cluster)

    // 💰 AFFILIATE INJECTION
    content = injectAffiliateLinks(content, buyerKeywords)

    const slug = keyword.replace(/\s+/g, "-").toLowerCase()
    const url = `${context.domain}/${slug}.html`

    // 🔥 MAIN CTA LINK (DYNAMIC)
    const mainAffiliate = generateAffiliateLink(keyword)

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

<!-- 🔥 Dynamic Affiliate CTA -->
<a href="${mainAffiliate}" target="_blank" rel="nofollow sponsored">
🔥 Explore ${keyword}
</a>

${content}

<div style="margin-top:30px;padding:20px;background:#000;color:#fff;text-align:center;">
<h2>🚀 Take Action</h2>

<a href="${mainAffiliate}" target="_blank" rel="nofollow sponsored" style="color:#fff;">
Get Best Deal on ${keyword}
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