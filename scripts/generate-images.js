import fs from "fs"

const folder = "assets/images"

fs.mkdirSync(folder,{recursive:true})

if(!fs.existsSync("blog")) return

fs.readdirSync("blog").forEach(file=>{

const slug = file.replace(".html","")

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="100%" height="100%" fill="#0f172a"/>
<text x="50%" y="50%" fill="#fff"
font-size="48" text-anchor="middle">
${slug.replace(/-/g," ")}
</text>
</svg>
`

fs.writeFileSync(`${folder}/${slug}.svg`,svg)

})

console.log("✅ SEO images generated")