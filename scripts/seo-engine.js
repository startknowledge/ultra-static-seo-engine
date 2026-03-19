import fs from "fs"

export function generateSEOFiles(){

const blogDir = "blog"

if(!fs.existsSync(blogDir)) return

const files = fs.readdirSync(blogDir)

files.forEach(file=>{

let html = fs.readFileSync(`blog/${file}`,"utf8")

// inject meta if missing
if(!html.includes("og:title")){

html = html.replace("</head>",`
<meta property="og:title" content="${file}">
<meta property="og:type" content="article">
</head>
`)
}

fs.writeFileSync(`blog/${file}`,html)

})

console.log("✅ SEO enhanced")

}