import fs from "fs"

const base = process.env.SITE_URL || "https://example.com"

const folders=[
"pages",
"blog",
"tools",
"comparison",
"glossary"
]

let urls=[]

folders.forEach(folder=>{

if(!fs.existsSync(folder)) return

const files=fs.readdirSync(folder)

files.forEach(file=>{

if(file.endsWith(".html")){

urls.push(`${base}/${folder}/${file}`)

}

})

})

let xml=`<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

urls.forEach(url=>{

xml+=`
<url>
<loc>${url}</loc>
</url>
`

})

xml+=`
</urlset>
`

fs.writeFileSync("sitemap.xml",xml)

console.log("Sitemap generated")