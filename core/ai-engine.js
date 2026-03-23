import { GoogleGenerativeAI } from "@google/generative-ai"

// ================= CONFIG =================
const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash"
]

function getModel(){
  return MODELS[Math.floor(Math.random() * MODELS.length)]
}

// ================= MAIN =================
export async function generateAI(niche="", keywords=[], existingSlugs=[]){

  const prompt = `
Act as Ultra Advanced SEO AI Engine.

Niche: ${niche}

Keywords:
${keywords.join(",")}

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

      const key = process.env.GEMINI_API_KEY1

      if(!key){
        console.log("⚠️ No API key")
        return []
      }

      const genAI = new GoogleGenerativeAI(key)

      const model = genAI.getGenerativeModel({
        model: getModel()   // ✅ AUTO SWITCH MODEL
      })

      const result = await model.generateContent(prompt)

      const text = result.response.text()

      // 🔥 SAFE JSON PARSE
      const clean = text
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim()

      const data = JSON.parse(clean)

      if(Array.isArray(data)){
        return data
      }

    }catch(err){
      console.log(`⚠️ Retry ${attempt + 1}:`, err.message)
      await new Promise(r => setTimeout(r, 2000 * (attempt+1)))
    }
  }

  return []
}