import fs from "fs"
import { injectAds } from "../engine/monetization-engine.js"
import { generateSmartContent } from "../ai/hybrid-engine.js"

export async function generateBlogs(strategy, context) {
const blogs = []
const unique = Date.now()

if (!fs.existsSync("./docs")) fs.mkdirSync("./docs")

for (const keyword of strategy.cluster) {

// 🔥 HYBRID AI (MAIN CHANGE)
let content = await generateSmartContent(`

Write a detailed, SEO optimized blog post about "${keyword}".
Make it highly informative, engaging, and user-focused.
Use headings, paragraphs, and proper structure.
`, keyword)

if (!content) {
  console.log("⚠️ Empty content → skip:", keyword)
  continue
}

const slug = keyword.replace(/\s+/g, "-").toLowerCase()
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

    // 💾 SAVE FILE
    fs.writeFileSync(`./docs/${slug}.html`, html)

    console.log("✅ Blog:", url)

    blogs.push({
      slug,
      keyword,
      url
    })
  }

  return blogs
}