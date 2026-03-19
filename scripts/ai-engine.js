import { GoogleGenerativeAI } from "@google/generative-ai"

const keys = [
process.env.GEMINI_API_KEY1,
process.env.GEMINI_API_KEY2,
process.env.GEMINI_API_KEY3
]

const key = keys[Math.floor(Math.random()*keys.length)]
const genAI = new GoogleGenerativeAI(key)

export async function generateAI(existingSlugs){

const model = genAI.getGenerativeModel({
model:"gemini-2.5-flash"
})

const prompt = `
Act as advanced SEO AI.

Generate 3 high quality blog posts.

Avoid topics similar to:
${existingSlugs.join(",")}

Return JSON:
[
{
"title":"",
"description":"",
"content":"<article>HTML</article>",
"keywords":["seo","tools","ai"]
}
]
`

const result = await model.generateContent(prompt)

let text = result.response.text()

text = text.replace(/```json/g,"").replace(/```/g,"")

return JSON.parse(text)
}