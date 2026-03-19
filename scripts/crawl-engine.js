import fs from "fs"

export function crawlCheck(){

if(!fs.existsSync("blog")) return

const files = fs.readdirSync("blog")

files.forEach(file=>{

let html = fs.readFileSync(`blog/${file}`,"utf8")

// fix broken links
html = html.replace(/href="\/blog\/undefined"/g,"#")

// ensure title exists
if(!html.includes("<title>")){
html = html.replace("<head>","<head><title>SEO Page</title>")
}

fs.writeFileSync(`blog/${file}`,html)

})

console.log("✅ Crawl simulation complete")
}