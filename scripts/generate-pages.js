import fs from "fs"
import path from "path"

const pages = [
"about",
"privacy-policy",
"terms-and-conditions",
"contact",
"disclaimer",
"cookies-policy",
"support",
"documentation",
"changelog"
]

// ensure pages folder exists
if(!fs.existsSync("pages")){
fs.mkdirSync("pages",{recursive:true})
}

const template = fs.readFileSync(
  new URL("../templates/page-template.html", import.meta.url),
  "utf8"
)

pages.forEach(page=>{

const title = page.replace(/-/g," ")

let html = template
.replace(/{{title}}/g,title)
.replace(/{{description}}/g,`${title} page of the website`)

fs.writeFileSync(`pages/${page}.html`,html)

})

console.log("Pages generated")
