import fs from "fs"

export function interlinkNetwork(){

if(!fs.existsSync("blog")) return

const files = fs.readdirSync("blog")

files.forEach(file=>{

let html = fs.readFileSync(`blog/${file}`,"utf8")

html += `
<footer>
<p>Part of SEO Network</p>
</footer>
`

fs.writeFileSync(`blog/${file}`,html)

})

console.log("🌐 Network linking added")

}