import fs from "fs"

const base = process.env.SITE_URL

let rss = `<?xml version="1.0"?>
<rss version="2.0">
<channel>

<title>SEO Engine Blog</title>
<link>${base}</link>
<description>Latest AI blogs</description>
`

if(fs.existsSync("blog")){

fs.readdirSync("blog").forEach(file=>{

const slug = file.replace(".html","")

rss += `
<item>
<title>${slug}</title>
<link>${base}/blog/${slug}.html</link>
<pubDate>${new Date().toUTCString()}</pubDate>
</item>
`

})

}

rss += "</channel></rss>"

fs.writeFileSync("rss.xml",rss)

console.log("✅ RSS improved")