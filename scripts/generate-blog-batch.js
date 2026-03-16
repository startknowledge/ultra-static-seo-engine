import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs"

// Random API key
const keys = [
process.env.GEMINI_API_KEY1,
process.env.GEMINI_API_KEY2,
process.env.GEMINI_API_KEY3
]

const key = keys[Math.floor(Math.random() * keys.length)]

const genAI = new GoogleGenerativeAI(key)


// Extract JSON safely
function extractJSON(text){

const start = text.indexOf("[")
const end = text.lastIndexOf("]")

if(start === -1 || end === -1){
throw new Error("JSON not found in AI response")
}

return text.substring(start,end+1)

}


// Generate blogs
async function generateBlogs(){

const model = genAI.getGenerativeModel({
model:"gemini-2.5-flash"
})

const prompt = `
Generate 10 SEO blog posts.

Return ONLY valid JSON array.

Format:

[
{
"title":"...",
"slug":"...",
"content":"..."
}
]

Rules:
- content must be HTML
- no markdown
- no explanation
`

const result = await model.generateContent(prompt)

const response = await result.response

const raw = response.text()

let blogs=[]

try{

const cleanJSON = extractJSON(raw)

blogs = JSON.parse(cleanJSON)

}catch(e){

console.log("AI JSON ERROR")
console.log(e)

return
}


// Save blogs
for(const blog of blogs){

const html = `
<html>
<head>
<title>${blog.title}</title>
</head>
<body>
${blog.content}
</body>
</html>
`

fs.writeFileSync(`blog/${blog.slug}.html`,html)

}

console.log("Blogs Generated:",blogs.length)

}


generateBlogs()
