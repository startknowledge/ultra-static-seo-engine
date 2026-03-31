import { generateAIContent as gemini } from "./ai-engine.js"

// 🔥 GROQ CALL
async function callGroq(prompt) {
const key = process.env.GROQ_API1
if (!key) return null

try {
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
method: "POST",
headers: {
"Authorization": `Bearer ${key}`,
"Content-Type": "application/json"
},
body: JSON.stringify({
model: "mixtral-8x7b-32768",
messages: [{ role: "user", content: prompt }]
})
})

const data = await res.json()
return data?.choices?.[0]?.message?.content || null

} catch {
return null
}
}

// 🔥 OPENROUTER (OPENAI)
async function callOpenRouter(prompt) {
const key = process.env.OPENAI_OPENROUTER1
if (!key) return null

try {
const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
method: "POST",
headers: {
"Authorization": `Bearer ${key}`,
"Content-Type": "application/json"
},
body: JSON.stringify({
model: "openai/gpt-4o-mini",
messages: [{ role: "user", content: prompt }]
})
})


const data = await res.json()
return data?.choices?.[0]?.message?.content || null


} catch {
return null
}
}

// 🔥 HUGGINGFACE
async function callHF(prompt) {
const key = process.env.HUGGINGFACE_TOKEN1
if (!key) return null

try {
const res = await fetch(
"https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct",
{
method: "POST",
headers: {
"Authorization": `Bearer ${key}`,
"Content-Type": "application/json"
},
body: JSON.stringify({ inputs: prompt })
}
)


const data = await res.json()
return data?.[0]?.generated_text || null


} catch {
return null
}
}

// 🔥 FINAL HYBRID ENGINE
export async function generateSmartContent(prompt, trendKeyword = "") {

console.log("🧠 Hybrid AI Engine Started")

// 🥇 GEMINI (if enabled later)
let res = await gemini(prompt)
if (res) {
console.log("✅ Gemini success")
return res
}

// 🥈 GROQ
res = await callGroq(prompt)
if (res) {
console.log("✅ Groq success")
return res
}

// 🥉 OPENROUTER
res = await callOpenRouter(prompt)
if (res) {
console.log("✅ OpenAI success")
return res
}

// 🔁 HUGGINGFACE
res = await callHF(prompt)
if (res) {
console.log("✅ HF success")
return res
}

// 💀 FINAL FALLBACK (TRENDS BASED CONTENT)
console.log("⚠️ AI failed → using trends fallback")

return `

<h1>${trendKeyword}</h1>
<p>${trendKeyword} is currently trending. Here are the latest updates and insights.</p>
<p>This topic is gaining attention worldwide. Stay updated with the latest news, tools, and opportunities.</p>
`
}
