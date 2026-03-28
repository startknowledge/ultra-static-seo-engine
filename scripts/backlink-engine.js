import fs from "fs"

export function runBacklinkEngine() {

if(!fs.existsSync("blog")) return

const files = fs.readdirSync("blog")
.filter(f => f.endsWith(".html") && !f.includes(".gitkeep"))

files.forEach(file=>{

let html = fs.readFileSync(`blog/${file}`,"utf8")

const randomLinks = files
.filter(f=>f!==file)
.sort(()=>0.5-Math.random())
.slice(0,5)

let backlinks = "<h3>Recommended Resources</h3><ul>"

randomLinks.forEach(l=>{
const slug = l.replace(".html","")
backlinks += `<li><a href="/blog/${slug}.html">${slug}</a></li>`
})

backlinks += "</ul>"

html = html.replace("</body>", backlinks + "</body>")

fs.writeFileSync(`blog/${file}`,html)

})

console.log("🔗 Backlinks created")

}