import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
})

export async function generateArticle(topic){

const prompt = `
Write a detailed SEO optimized blog article about "${topic}".

Requirements:

- Length: 3000 to 5000 words
- Format: Clean HTML
- Use multiple headings (H2, H3, H4)
- Write natural human style content
- Avoid AI sounding phrases
- Include practical examples
- Include step-by-step explanations
- Include a FAQ section
- Write an SEO friendly conclusion
Structure:

Introduction  
How ${topic} Works  
Benefits of ${topic}  
Best Tools for ${topic}  
Step by Step Guide  
Common Mistakes  
FAQ  
Conclusion

Return only HTML content inside <article> tags.
`

const result = await model.generateContent(prompt)

const text = result.response.text()

return text

}

