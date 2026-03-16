import fs from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"

// multiple API keys
const keys=[
process.env.GEMINI_API_KEY1,
process.env.GEMINI_API_KEY2,
process.env.GEMINI_API_KEY3
]

// random key
const key=keys[Math.floor(Math.random()*keys.length)]

const genAI=new GoogleGenerativeAI(key)

const model=genAI.getGenerativeModel({
model:"gemini-2.5-flash"
})

// create blog folder
if(!fs.existsSync("blog")){
fs.mkdirSync("blog",{recursive:true})
}

// delay function
function delay(ms){
return new Promise(r=>setTimeout(r,ms))
}

async function generateBlogs(){

const prompt=`
Generate 20 SEO optimized blog articles about developer tools.

Return ONLY valid JSON like this:

[
{
"title":"blog title",
"slug":"blog-url-slug",
"content":"full HTML article with headings"
}
]

No markdown
No explanation
`

const result=await model.generateContent(prompt)

let text=result.response.text().trim()

// remove markdown
text=text.replace(/```json/g,"")
text=text.replace(/```/g,"")

const blogs=JSON.parse(text)

blogs.forEach(blog=>{

const html=`
<!DOCTYPE html>
<html>

<head>

<title>${blog.title}</title>

<meta name="description" content="${blog.title}">

</head>

<body>

<h1>${blog.title}</h1>

${blog.content}

</body>

</html>
`

fs.writeFileSync(`blog/${blog.slug}.html`,html)

})

console.log("20 blogs generated")

}

async function run(){

for(let i=0;i<2;i++){

await generateBlogs()

// delay to avoid rate limit
await delay(2000)

}

}

run()