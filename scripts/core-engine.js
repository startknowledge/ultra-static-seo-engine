import { GoogleGenerativeAI } from "@google/generative-ai"

const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro"
]

function getModel(){
  return MODELS[Math.floor(Math.random() * MODELS.length)]
}

export async function generateAI(niche="", keywords=[], existingSlugs=[]){

  const prompt = `
Generate 3 SEO blog posts in JSON.

Niche: ${niche}
Keywords: ${keywords.join(",")}
Avoid: ${existingSlugs.join(",")}

Format:
[
{
"title":"",
"description":"",
"content":"<p>...</p>",
"keywords":[]
}
]

Rules:
- 1200+ words
- HTML only
- No markdown
`

  for(let i=0;i<5;i++){
    try{

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1)

      const model = genAI.getGenerativeModel({
        model: getModel()
      })

      const result = await model.generateContent(prompt)

      const text = result.response.text()

      const clean = text
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim()

      const data = JSON.parse(clean)

      if(Array.isArray(data)) return data

    }catch(e){
      console.log("⚠️ Retry:", i+1, e.message)
      await new Promise(r=>setTimeout(r,2000))
    }
  }

  return []
}