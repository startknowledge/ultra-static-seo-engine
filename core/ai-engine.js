import { GoogleGenerativeAI } from "@google/generative-ai"
import { retry } from "./retry.js"
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

// 🔥 CLEAN JSON PARSER
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

// 🔥 KEYWORD EXPANSION
function expandKeywords(base=[]){
  const extra = ["best","2026","guide","tools","free","advanced","strategy"]
  return [...new Set([...base, ...extra])]
}

// 🔥 TIMEOUT WRAPPER
function timeoutPromise(ms){
  return new Promise((_, reject)=>
    setTimeout(()=>reject(new Error("Timeout")), ms)
  )
}

// ================= MAIN =================

export async function generateAI(niche="", keywords=[], existingSlugs=[]){

  return retry(async ()=>{

    const key = getKey()

    if(!key){
      log("⚠️ No API key → fallback")
      return fallback(niche, keywords)
    }

    const genAI = new GoogleGenerativeAI(key)

    const model = genAI.getGenerativeModel({
      model:"gemini-2.5-flash"
    })

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
- Add internal links naturally
- No markdown
- Only JSON output
`

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise(40000)
    ])

    let text = result.response.text()

    const data = safeJSON(text)

    if(!Array.isArray(data) || data.length === 0){
      log("⚠️ Empty AI → fallback")
      return fallback(niche, keywords)
    }

    return data

  },5)
}

// ================= FALLBACK =================

function fallback(niche, keywords){

  return [
    {
      title: `${keywords[0] || "SEO"} Guide 2026`,
      description: "Advanced SEO Guide",
      keywords: keywords,
      content: `
<p>Intro about ${niche}</p>

<h2>Main Strategy</h2>
<p>Detailed content...</p>

<h3>Steps</h3>
<ul>
<li>Step 1</li>
<li>Step 2</li>
</ul>

<h2>FAQs</h2>
<ul>
<li><strong>What is SEO?</strong> Answer</li>
</ul>

<h2>Conclusion</h2>
<p>Done</p>
`
    }
  ]
}