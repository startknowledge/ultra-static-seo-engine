import fs from "fs"
import { generateAIContent } from "../ai/ai-engine.js"
import { SETTINGS } from "../config/settings.js"

export async function generateBlogs(strategy) {
  const blogs = []

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

<h1>${keyword}</h1>

<!-- 🔥 CTA TOP -->
<div style="background:#f4f4f4;padding:15px;margin:20px 0">
<b>🔥 Recommended:</b>
<a href="#">Check Best ${keyword} Tools</a>
</div>

${content}

<!-- 🔥 CTA BOTTOM -->
<div style="background:#000;color:#fff;padding:20px;text-align:center">
<h2>🚀 Want Results Fast?</h2>
<a href="#" style="color:#0f0">Start Now</a>
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