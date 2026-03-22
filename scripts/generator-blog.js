import fs from "fs"
import { render } from "../core/template-engine.js"
import { generateAI } from "../core/ai-engine.js"
import { validateContent } from "../scripts/content-quality.js"

const BLOG_DIR = "blog"

function slugify(text){
return text
.toLowerCase()
.replace(/[^a-z0-9\s]/g,"")
.replace(/\s+/g,"-")
}

// 🔥 PHASE-5 OPTIMIZATION
function optimizeTitle(title){
return title.length > 60 ? title.slice(0,60) : title
}

function injectAds(content){

const adTop = `<div class="ad ad-top">Ad Space Top</div>`
const adMid = `<div class="ad ad-mid">Ad Space Middle</div>`
const adBottom = `<div class="ad ad-bottom">Ad Space Bottom</div>`

let parts = content.split("</p>")

if(parts.length > 3){
parts.splice(1,0,adTop)
parts.splice(Math.floor(parts.length/2),0,adMid)
parts.push(adBottom)
}

return parts.join("</p>")
}

function predictRanking(content){

let score = 0

if(content.includes("<h2>")) score += 20
if(content.length > 3000) score += 30
if(content.includes("<ul>")) score += 10
if(content.includes("<strong>")) score += 10
if(content.includes("FAQ")) score += 20

return score
}

// ================= MAIN =================

export async function generateBlogs(niche="", keywords=[]){

if(!fs.existsSync(BLOG_DIR)){
fs.mkdirSync(BLOG_DIR)
}

const existing = fs.readdirSync(BLOG_DIR)
.filter(f => f.endsWith(".html") && !f.includes(".gitkeep"))
.map(f=>f.replace(".html",""))

const blogs = await generateAI(niche, keywords, existing)

for(const blog of blogs){
  
if(!validateContent(article)){
  console.log("❌ Skipped low quality")
  return
}
if(!blog.title || !blog.content) continue

let title = optimizeTitle(blog.title)
let content = injectAds(blog.content)

const score = predictRanking(content)

if(score < 50){
console.log("⚠️ Low quality skipped:", title)
continue
}

const slug = slugify(title)

if(existing.includes(slug)){
console.log("⏩ Skip duplicate:", slug)
continue
}

const html = render("../templates/blog-template.html",{
title: title,
description: blog.description || title,
content: content,
slug: slug,
keywords: blog.keywords?.join(",") || "",
image: `https://source.unsplash.com/800x400/?${slug}`,
date: new Date().toISOString()
})

fs.writeFileSync(`${BLOG_DIR}/${slug}.html`,html)

console.log("✅ Blog:",slug)

}
}
if (process.argv[1].includes("generator-blog.js")) {
  generateBlogs("general", ["seo","ai","tools"])
}
