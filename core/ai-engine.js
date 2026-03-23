import { GoogleGenerativeAI } from "@google/generative-ai"
import { log } from "./logger.js"

const keys = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
  process.env.GEMINI_API_KEY6
].filter(Boolean)

function getKey(){
  return keys[Math.floor(Math.random() * keys.length)]
}

function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

function safeJSON(text){
  try{
    return JSON.parse(text)
  }catch{
    try{
      const cleaned = text
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim()
      return JSON.parse(cleaned)
    }catch{
      log("❌ JSON Parse Failed")
      return []
    }
  }
}

function expandKeywords(base=[]){
  const extra = ["best","2026","guide","tools","free"]
  return [...new Set([...base, ...extra])]
}

export async function generateAI(niche="", keywords=[], existingSlugs=[]){

  const finalKeywords = expandKeywords(keywords)

  const prompt = `
Act as Ultra Advanced SEO AI Engine.

Niche: ${niche}
Keywords: ${finalKeywords.join(",")}

Avoid duplicate topics:
${existingSlugs.join(",")}

Generate 3 HIGH QUALITY blog posts.

STRICT JSON FORMAT:
[
{
"title":"SEO optimized title",
"description":"meta description",
"content":"<p>HTML content</p>",
"keywords":["k1","k2"]
}
]

RULES:
- Minimum 1200 words
- Use <h2>, <h3>, <p>, <ul>, <strong>
- No markdown
- Only JSON output
`

  for(let attempt = 0; attempt < 5; attempt++){
    try{

      const key = getKey()
      if(!key) return fallback(niche, keywords)

      const genAI = new GoogleGenerativeAI(key)

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
      })

      const result = await model.generateContent(prompt)

      const text = result.response.text()

      const data = safeJSON(text)

      if(Array.isArray(data) && data.length){
        return data
      }

      log("⚠️ Empty AI response")

    }catch(err){
      log(`⚠️ Retry ${attempt + 1}: ${err.message}`)
      await sleep(2000 * (attempt + 1))
    }
  }

  return fallback(niche, keywords)
}

function fallback(niche, keywords){
  return [
    {
      title: `${keywords[0] || "SEO"} Guide 2026`,
      description: "Auto fallback content",
      keywords,
      content: `<p>Complete guide about ${niche}. This is fallback content with SEO structure.</p>
      <h2>Introduction</h2>
      <p>This article covers ${keywords.join(", ")}</p>
      <h2>Details</h2>
      <ul><li>Point 1</li><li>Point 2</li></ul>
      <p>More content...</p>`
    }
  ]
}