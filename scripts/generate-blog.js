import fs from "fs"
import { render } from "./template-engine.js"
import { generateAI } from "./ai-engine.js"

const BLOG_DIR = "blog"

function slugify(text){
return text.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g,"-")
}

export async function generateBlogs(){

if(!fs.existsSync(BLOG_DIR)){
fs.mkdirSync(BLOG_DIR)
}

const existing = fs.readdirSync(BLOG_DIR)
.map(f=>f.replace(".html",""))

const blogs = await generateAI(existing)

for(const blog of blogs){

const slug = slugify(blog.title)

if(existing.includes(slug)) continue

const html = render("templates/blog-template.html",{
title: blog.title,
description: blog.description,
content: blog.content,
slug: slug,
keywords: blog.keywords?.join(","),
image: `https://source.unsplash.com/800x400/?${slug}`,
date: new Date().toISOString()
})

fs.writeFileSync(`${BLOG_DIR}/${slug}.html`,html)

console.log("✅ Blog:",slug)

}

}