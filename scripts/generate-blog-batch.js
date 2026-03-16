import fs from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
})

// ensure blog folder exists
if(!fs.existsSync("blog")){
  fs.mkdirSync("blog",{recursive:true})
}

async function generateBlogs(){

const prompt = `
Generate 10 SEO optimized blog articles about developer tools.

Return ONLY valid JSON in this format:

[
{
"title":"blog title",
"slug":"url-slug",
"content":"full blog article in HTML with headings"
}
]

No markdown
No explanation
`

const result = await model.generateContent(prompt)

let text = result.response.text().trim()

// remove markdown if returned
text = text.replace(/```json/g,"")
text = text.replace(/```/g,"")

const blogs = JSON.parse(text)

blogs.forEach(blog => {

const html = `
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

console.log("10 blogs generated")

}

generateBlogs()
