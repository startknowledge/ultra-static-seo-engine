import fs from "fs"

export function generateInternalLinks(){

if(!fs.existsSync("blog")) return

const files = fs.readdirSync("blog")

files.forEach(file => {

let html = fs.readFileSync(`blog/${file}`,"utf8")

let linksBlock = `<div class="related-links">`

files.forEach(link => {

if(file !== link){

const slug = link.replace(".html","")

linksBlock += `<a href="/blog/${slug}">${slug}</a><br>`

}

})

linksBlock += `</div>`

// prevent duplicate injection
if(!html.includes("related-links")){
 html += linksBlock
}

fs.writeFileSync(`blog/${file}`,html)

})

console.log("✅ Internal links added")

}

// direct run
if (process.argv[1].includes("internal-links.js")) {
 generateInternalLinks()
}