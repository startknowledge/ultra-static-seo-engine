import fs from "fs"

export function generateLinks(){

const files = fs.readdirSync("blog")

files.forEach(file=>{

let html = fs.readFileSync(`blog/${file}`,"utf8")

const related = files
.filter(f=>f!==file)
.sort(()=>0.5-Math.random())
.slice(0,5)

let block = "<h3>Related Articles</h3><ul>"

related.forEach(r=>{
const slug = r.replace(".html","")
block += `<li><a href="/blog/${slug}.html">${slug}</a></li>`
})

block += "</ul>"

html = html.replace("</body>", block + "</body>")

fs.writeFileSync(`blog/${file}`,html)

})

console.log("✅ Smart linking done")

}