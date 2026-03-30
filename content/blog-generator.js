import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { injectAds } from "../engine/monetization-engine.js"

export async function generateBlogs(strategy, context) {
  const blogs = []
  const unique = Date.now()

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    let content = await generateAIContent(`
Create a detailed and helpful article about "${keyword}".
`)

    if (!content || content.length < 50) {
      console.log("⚠️ Skipped:", keyword)
      continue
    }

    const slug = keyword.replace(/\s+/g, "-").toLowerCase()
    const url = `${context.domain}/${slug}.html`   // ✅ FIXED
    
    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${keyword}</title>
<meta name="description" content="Latest insights on ${keyword}">
<link rel="canonical" href="${url}">

<style>
body { font-family: Arial; margin: 20px; }
.cta { background:#000;color:#fff;padding:20px;text-align:center;margin:30px 0 }
</style>
</head>

<body>

<!-- build-id: ${unique} -->
<!-- build-id: ${Date.now()} -->

<h1>${keyword}</h1>

<a href="https://AmazonAffileted?ref=seo-engine" target="_blank">
🔥Explore ${keyword}
</a>

${content}

<div class="cta">
<h2>🚀 Take Action Now</h2>
<a href="https://AmazonAffileted?ref=seo-engine" target="_blank" style="color:#fff;">
Get Started
</a>
</div>

</body>
</html>
`

    // 🔥 ADS INJECTION ONLY HERE
    html = injectAds(html)

    fs.writeFileSync(`./dist/${slug}.html`, html)

    blogs.push({
      slug,
      keyword,
      url
    })

    console.log("✅ Blog:", url)
  }

  return blogs
}