import fs from "fs"

export function generateSitemap(){

const base = process.env.SITE_URL

const folders = ["","pages","blog","tools","comparison","glossary"]

let urls = ""

folders.forEach(folder=>{

if(folder && !fs.existsSync(folder)) return

const files = folder
? fs.readdirSync(folder)
: ["index.html"]

files.forEach(file=>{

if(file.endsWith(".html")){

const path = folder ? `${folder}/${file}` : file

urls += `
<url>
<loc>${base}/${path}</loc>
<changefreq>weekly</changefreq>
<priority>0.8</priority>
</url>
`

}

})

})

const xml = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

fs.writeFileSync("sitemap.xml",xml)

console.log("✅ Sitemap generated")

}

// direct run
if (process.argv[1].includes("generate-sitemap.js")) {
 generateSitemap()
}