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
  return keys[Math.floor(Math.random()*keys.length)]
}

// ✅ DELAY SYSTEM
function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

// ✅ CLEAN JSON
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

// ✅ KEYWORD EXPANSION
function expandKeywords(base=[]){
  const extra = ["best","2026","guide","tools","free"]
  return [...new Set([...base, ...extra])]
}

// ================= MAIN =================

export async function generateAI(niche="", keywords=[], existingSlugs=[]){

  const finalKeywords = expandKeywords(keywords)

  const prompt = `
Act as Ultra Advanced SEO AI Engine.

Niche: ${niche}

Keywords:
${finalKeywords.join(",")}

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

  // 🔥 RETRY LOOP WITH DELAY
  for(let attempt=0; attempt<5; attempt++){

    try{

      const key = getKey()

      if(!key){
        log("⚠️ No API key → fallback")
        return fallback(niche, keywords)
      }

      const genAI = new GoogleGenerativeAI(key)

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      })

      // ✅ FIXED API CALL
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })

      const text = result.response.text()

      const data = safeJSON(text)

      if(Array.isArray(data) && data.length > 0){
        return data
      }

      log("⚠️ Empty AI response")

    }catch(err){

      log(`⚠️ Rate limit retry... ${attempt+1}`)

      // ✅ EXPONENTIAL DELAY
      await sleep(2000 * (attempt + 1))
    }
  }

  return fallback(niche, keywords)
}

// ================= FALLBACK =================

function fallback(niche, keywords){
  return [
    {
      title: `${keywords[0] || "SEO"} Guide 2026`,
      description: "SEO Guide fallback",
      keywords: keywords,
      content: `<p>Fallback content for ${niche}</p>`
    }
  ]
}