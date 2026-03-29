import fs from "fs"
import { SETTINGS } from "../config/settings.js"

export async function generateBlogs(strategy) {
  const blogs = []

  if (!fs.existsSync("./dist")) fs.mkdirSync("./dist")

  strategy.cluster.forEach(keyword => {
    const slug = keyword.replace(/\s+/g, "-")

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<title>${keyword} | ${SETTINGS.siteName}</title>

<meta name="description" content="Complete guide on ${keyword}">
<meta name="keywords" content="${keyword}, guide, tips">
<meta name="author" content="${SETTINGS.siteName}">
<meta name="robots" content="index, follow">

<link rel="canonical" href="${SETTINGS.domain}/${slug}.html">

<!-- Open Graph -->
<meta property="og:title" content="${keyword}">
<meta property="og:description" content="Learn ${keyword}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SETTINGS.domain}/${slug}.html">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">

</head>

<body>
<h1>${keyword}</h1>
<p>AI-generated content for ${keyword}</p>

</body>
</html>
`

    fs.writeFileSync(`./dist/${slug}.html`, html)

    blogs.push({
      slug,
      keyword,
      url: `${SETTINGS.domain}/${slug}.html`,
      date: new Date().toISOString()
    })
  })

  return blogs
}