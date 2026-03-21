import fs from "fs"

const BLOG_DIR = "./blog"

// 🔗 extract links
function extractLinks(html){
  const regex = /<a href="(.*?)"/g
  let links = []
  let match

  while((match = regex.exec(html))){
    links.push(match[1])
  }

  return links
}

// 🔥 auto internal linking
function addInternalLinks(html, allSlugs){

  let words = html.split(" ")

  return words.map(word=>{
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g,"")

    if(allSlugs.includes(clean)){
      return `<a href="/blog/${clean}.html">${word}</a>`
    }

    return word
  }).join(" ")
}

// ================= MAIN =================

export function runLinkEngine(){

  if(!fs.existsSync(BLOG_DIR)){
    console.log("❌ Blog folder missing")
    return
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f=>f.endsWith(".html"))

  const slugs = files.map(f=>f.replace(".html",""))

  for(const file of files){

    const path = `${BLOG_DIR}/${file}`

    let html = fs.readFileSync(path,"utf-8")

    html = addInternalLinks(html, slugs)

    fs.writeFileSync(path, html)

    console.log("🔗 Links optimized:", file)
  }

}