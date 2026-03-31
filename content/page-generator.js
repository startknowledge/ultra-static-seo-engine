import fs from "fs"
import { SETTINGS } from "../config/settings.js"

export async function generatePages(strategy) {
  const pages = ["about", "contact", "privacy"]

  return pages.map(page => {
    const html = `
<html>
<head>
<title>${page} | ${SETTINGS.siteName}</title>
<meta name="description" content="${page} page of ${SETTINGS.siteName}">
<link rel="canonical" href="${SETTINGS.domain}/${page}.html">
</head>
<body>
<h1>${page}</h1>
</body>
</html>
`
    fs.writeFileSync(`./docs/${page}.html`, html)

    return {
      slug: page,
      url: `${SETTINGS.domain}/${page}.html`,
      date: new Date().toISOString()
    }
  })
}