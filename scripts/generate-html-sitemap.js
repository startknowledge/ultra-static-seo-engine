import fs from "fs"

export function generateHTMLSitemap(){

const base = process.env.SITE_URL || "https://ultrastaticseoengine.startknowledge.in"
const lang = process.env.SITE_LANG || "en"

const folders = ["pages","blog","tools","comparison","glossary"]

let links = ""

folders.forEach(folder=>{
if(!fs.existsSync(folder)) return

fs.readdirSync("blog")
.filter(f => f.endsWith(".html") && !f.includes(".gitkeep"))
.forEach(file=>{
if(file.endsWith(".html")){

const slug = file.replace(".html","")

links += `
<li class="sitemap-item">
  <a href="${base}/${folder}/${file}">
    ${slug.replace(/-/g," ")}
  </a>
</li>
`

}
})
})

const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>HTML Sitemap</title>
<meta name="description" content="Complete sitemap of all pages">

<meta name="robots" content="index, follow">
<link rel="canonical" href="${base}/sitemap.html">

<!-- CSS -->
<link rel="stylesheet" href="/css/style.css">

</head>

<body>

<div class="container">

<header class="header">
  <h1>📄 Sitemap</h1>
</header>

<main>
  <ul class="sitemap-grid">
    ${links || "<p>No pages found</p>"}
  </ul>
</main>

<footer class="footer">
  <p>© Sitemap Engine</p>
</footer>

</div>

</body>
</html>
`

fs.writeFileSync("sitemap.html",html)

console.log("✅ HTML Sitemap (External CSS) Generated")

}

// direct run
if (process.argv[1].includes("generate-html-sitemap.js")) {
 generateHTMLSitemap()
}