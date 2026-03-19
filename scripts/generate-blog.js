import fs from "fs"
import { render } from "./template-engine.js"
import { generateAI } from "./ai-engine.js"

// ✅ PHASE 5 IMPORTS
import { predictRanking } from "./ranking-engine.js"
import { optimizeTitle } from "./ctr-engine.js"
import { injectAds } from "./monetization-engine.js"

const BLOG_DIR = "blog"

function slugify(text){
return text
.toLowerCase()
.replace(/[^a-z0-9\s]/g,"")
.replace(/\s+/g,"-")
}

// ✅ UPDATED FUNCTION (niche + keywords support)
export async function generateBlogs(niche, keywords){

if(!fs.existsSync(BLOG_DIR)){
fs.mkdirSync(BLOG_DIR)
}

// existing blogs
const existing = fs.readdirSync(BLOG_DIR)
.map(f=>f.replace(".html",""))

// ✅ AI CALL WITH CONTEXT
const blogs = await generateAI(existing, niche, keywords)

for(const blog of blogs){

if(!blog.title || !blog.content) continue

// 🔥 CTR OPTIMIZATION
let title = optimizeTitle(blog.title)

// 🔥 ADS INJECTION
let content = injectAds(blog.content)

// 🔥 RANKING SCORE
const score = predictRanking(content)

// ❌ LOW QUALITY SKIP
if(score < 50){
console.log("⚠️ Skipped low quality:", title)
continue
}

// slug
const slug = slugify(title)

// ❌ duplicate skip
if(existing.includes(slug)){
console.log("⏩ Duplicate:", slug)
continue
}

// image
const image = `https://source.unsplash.com/800x400/?${slug}`

// render template
const html = render("templates/blog-template.html",{
title: title,
description: blog.description || title,
content: content,
slug: slug,
keywords: (keywords || []).join(","),
image: image,
date: new Date().toISOString()
})

// save
fs.writeFileSync(`${BLOG_DIR}/${slug}.html`,html)

console.log("✅ Blog:",slug,"Score:",score)

}

}