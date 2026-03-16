import fs from "fs"

const files = fs.readdirSync("blog")

files.forEach(file => {

let html = fs.readFileSync(`blog/${file}`,"utf8")

files.forEach(link => {

if(file !== link){

const slug = link.replace(".html","")

html += `<p>Related: <a href="/blog/${slug}">${slug}</a></p>`

}

})

fs.writeFileSync(`blog/${file}`,html)

})

console.log("Internal links added")