import fs from "fs"

const base = process.env.SITE_URL || "https://example.com"

const images = fs.readdirSync("assets/images")

let xml=`<?xml version="1.0" encoding="UTF-8"?>

<urlset
xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

`

images.forEach(img=>{

if(img.endsWith(".svg")){

xml+=`
<url>

<loc>${base}</loc>

<image:image>
<image:loc>${base}/assets/images/${img}</image:loc>
</image:image>

</url>
`

}

})

xml+=`</urlset>`

fs.writeFileSync("image-sitemap.xml",xml)

console.log("Image sitemap generated")