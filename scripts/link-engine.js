import fs from "fs"

const BLOG_DIR = "./blog"

function addInternalLinks(html, slugs){

  let added = 0

  return html.replace(/<p>(.*?)<\/p>/g, (match, content)=>{

    if(added >= 5) return match

    const randomSlug = slugs[Math.floor(Math.random()*slugs.length)]

    if(!randomSlug || content.includes("/blog/")) return match

    added++

    return `<p>${content} 
    <a href="/blog/${randomSlug}.html">${randomSlug.replace(/-/g," ")}</a>
    </p>`
  })
}

export function runLinkEngine(){

  if(!fs.existsSync(BLOG_DIR)){
    console.log("❌ Blog folder missing")
    return
  }
  /* if(article.includes(keyword)){
  content += `<a href="/blog/${slug}.html">${keyword}</a>`
} */
  const files = fs.readdirSync(BLOG_DIR)
  .filter(f => f.endsWith(".html") && !f.includes(".gitkeep"))

  const slugs = files.map(f=>f.replace(".html",""))

  for(const file of files){

    const path = `${BLOG_DIR}/${file}`

    let html = fs.readFileSync(path, "utf-8")

    html = addInternalLinks(html, slugs)

    fs.writeFileSync(path, html)

    console.log("🔗 Safe Links:", file)
  }
}
