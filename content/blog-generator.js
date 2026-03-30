import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { SETTINGS } from "../config/settings.js"

export async function generateBlogs(strategy) {
  const blogs = []
  const unique = Date.now()

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  for (const keyword of strategy.cluster) {

    const content = await generateAIContent(`
Write a HIGH CONVERTING SEO blog on "${keyword}"

Include:
- Introduction
- Best tools/products
- Pros & Cons
- Pricing section
- FAQ
- Conclusion with CTA

Use persuasive tone
`)

    const slug = keyword.replace(/\s+/g, "-").toLowerCase()

    const html = `
<!DOCTYPE html>
<html>
<head>
<title>${keyword} | ${SETTINGS.siteName}</title>
<meta name="description" content="Best guide for ${keyword}">
<link rel="canonical" href="${SETTINGS.domain}/${slug}.html">
</head>

<body>

<!-- 🔥 UNIQUE BUILD -->
<!-- build-id: ${unique} -->

<h1>${keyword}</h1>

<div style="background:#f4f4f4;padding:15px;margin:20px 0">
<b>🔥 Recommended:</b><br>

<a href="https://example.com?ref=seo-engine" target="_blank">
🔥 Buy Best ${keyword}
</a>
</div>

${content}

<!-- 🔥 CTA BLOCK -->
<div style="background:#000;color:#fff;padding:20px;text-align:center">
<h2>🚀 Start Now</h2>

<a href="https://AmazonKaLinkAffiliated?ref=seo-engine" target="_blank" style="color:#fff;">
Click Here to Get Best ${keyword}
</a>
</div>

</body>
</html>
`

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