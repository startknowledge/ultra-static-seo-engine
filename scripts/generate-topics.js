import fs from "fs"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
})

async function generateTopics(){

const prompt = `
Generate 20 SEO blog topics for developer tools.
Return ONLY valid JSON array.
No markdown.
No explanation.
Example:
["topic1","topic2"]
`

const result = await model.generateContent(prompt)

let text = result.response.text().trim()

// remove markdown if AI still returns it
text = text.replace(/```json/g,"")
text = text.replace(/```/g,"")
text = text.trim()

const topics = JSON.parse(text)

fs.writeFileSync(
  "data/blog-topics.json",
  JSON.stringify(topics,null,2)
)

console.log("AI topics generated")

}

generateTopics()
