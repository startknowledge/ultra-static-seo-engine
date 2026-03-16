import fs from "fs"

const base = process.env.SITE_URL || "https://example.com"

const files = fs.existsSync("blog")
? fs.readdirSync("blog")
: []

let rss=`<?xml version="1.0" encoding="UTF-8"?>

<rss version="2.0">
<channel>

<title>Ultra Static SEO Engine Blog</title>
<link>${base}</link>
<description>Latest AI generated blog posts</description>
`

files.forEach(file=>{

const slug=file.replace(".html","")

rss+=`
<item>
<title>${slug}</title>
<link>${base}/blog/${slug}.html</link>
</item>
`

})

rss+=`
</channel>
</rss>
`

fs.writeFileSync("rss.xml",rss)

console.log("RSS generated")