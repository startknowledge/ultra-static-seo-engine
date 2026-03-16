import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs"

// API keys
const keys = [
process.env.GEMINI_API_KEY1,
process.env.GEMINI_API_KEY2,
process.env.GEMINI_API_KEY3
]

const key = keys[Math.floor(Math.random()*keys.length)]

const genAI = new GoogleGenerativeAI(key)

function slugify(text){
return text
.toLowerCase()
.replace(/[^a-z0-9\s-]/g,"")
.replace(/\s+/g,"-")
.replace(/-+/g,"-")
}

// extract JSON
function extractJSON(text){
const start=text.indexOf("[")
const end=text.lastIndexOf("]")

if(start===-1 || end===-1){
throw new Error("JSON not found")
}

return text.substring(start,end+1)
}

async function generateBlogs(){

const model=genAI.getGenerativeModel({
model:"gemini-2.5-flash"
})

const prompt=`
Generate 10 SEO blog posts.

Return ONLY JSON array.

Format:

[
{
"title":"...",
"description":"...",
"content":"..."
}
]

Content must be HTML.
`

const result=await model.generateContent(prompt)
const response=await result.response
const raw = await response.text() // ensure you await it

let blogs = []

try {
  let clean = raw
    .replace(/```json/g,"")
    .replace(/```/g,"")
    .trim()

  blogs = JSON.parse(clean)
} catch(e) {
  console.log("JSON ERROR")
  console.log(e)
  return
}

//const template=fs.readFileSync("blog-template.html","utf8")
const template = fs.readFileSync(
  new URL("../templates/blog-template.html", import.meta.url),
  "utf8"
)

for(const blog of blogs){

const slug=slugify(blog.title)

let html=template
.replace(/{{title}}/g,blog.title)
.replace(/{{description}}/g,blog.description || blog.title)
.replace(/{{slug}}/g,slug)
.replace(/{{image}}/g,"/assets/images/blog-default.jpg")
.replace(/{{date}}/g,new Date().toISOString())
.replace(/{{content}}/g,blog.content)

fs.writeFileSync(`blog/${slug}.html`,html)

}

console.log("Blogs Generated:",blogs.length)

}

generateBlogs()
