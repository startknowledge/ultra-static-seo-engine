import { GoogleGenerativeAI } from "@google/generative-ai"

const keys = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3
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

    }catch(err){
      console.log("❌ JSON Parse Failed")
      return []
    }
  }
}

// 🔥 KEYWORD EXPANSION
function expandKeywords(base=[]){

  const extra = [
    "best","2026","guide","tools","free","advanced","strategy"
  ]

  return [...new Set([...base, ...extra])]
}

// ================= MAIN =================

export async function generateAI(niche="", keywords=[], existingSlugs=[]){

  const key = getKey()

  if(!key){
    console.log("⚠️ No API key → fallback mode")
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

  try{

    const result = await model.generateContent(prompt)

    let text = result.response.text()

    const data = safeJSON(text)

    if(!Array.isArray(data)){
      console.log("⚠️ Invalid AI response → fallback")
      return fallback(niche, keywords)
    }

    return data

  }catch(err){

    console.log("❌ AI ERROR:", err.message)

    return fallback(niche, keywords)
  }

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

/* import { GoogleGenerativeAI } from "@google/generative-ai"

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
} */