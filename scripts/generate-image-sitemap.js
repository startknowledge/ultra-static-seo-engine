import fs from "fs"

export function generateImageSitemap(){

const base = process.env.SITE_URL

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

if(fs.existsSync("blog")){

fs.readdirSync("blog")
.filter(f => f.endsWith(".html") && !f.includes(".gitkeep"))
.forEach(file=>{

const slug = file.replace(".html","")

xml += `
<url>
<loc>${base}/blog/${slug}.html</loc>
<image:image>
<image:loc>${base}/assets/images/${slug}.svg</image:loc>
</image:image>
</url>
`

})

}

xml += "</urlset>"

fs.writeFileSync("image-sitemap.xml",xml)

console.log("✅ Image sitemap generated")

}

// direct run
if (process.argv[1].includes("generate-image-sitemap.js")) {
 generateImageSitemap()
}