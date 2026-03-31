const API_CONFIG = [
{ key: process.env.GEMINI_API_KEY1, type: "gemini" },
{ key: process.env.GEMINI_API_KEY2, type: "gemini" },
{ key: process.env.GEMINI_API_KEY3, type: "gemini" },
{ key: process.env.GEMINI_API_KEY4, type: "gemini" },

{ key: process.env.GROQ_API1, type: "groq" },
{ key: process.env.OPENAI_OPENROUTER1, type: "openrouter" },
{ key: process.env.HUGGINGFACE_TOKEN1, type: "huggingface" }
].filter(x => x.key)

let index = 0

function getNextAPI() {
if (API_CONFIG.length === 0) {
console.log("❌ No API keys found")
return null
}

const api = API_CONFIG[index % API_CONFIG.length]
index++
return api
}

// 🔥 GEMINI
async function callGemini(key, prompt) {
try {
const res = await fetch(
`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${key}`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
contents: [{ parts: [{ text: prompt }] }]
})
}
)

const data = await res.json()

if (!res.ok) {
  console.log("⚠️ Gemini Error:", data?.error?.code)
  return null
}

return data?.candidates?.[0]?.content?.parts?.[0]?.text || null

} catch (e) {
console.log("⚠️ Gemini Fetch Error")
return null
}
}

// 🔥 GROQ
async function callGroq(key, prompt) {
try {
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
method: "POST",
headers: {
Authorization: `Bearer ${key}`,
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

// 🔥 OPENROUTER
async function callOpenRouter(key, prompt) {
try {
const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
method: "POST",
headers: {
Authorization: `Bearer ${key}`,
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
async function callHF(key, prompt) {
try {
const res = await fetch(
"https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct",
{
method: "POST",
headers: {
Authorization: `Bearer ${key}`,
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

// 🚀 MAIN ENGINE
export async function generateAIContent(prompt) {
console.log("🧠 Multi-AI Fixed Engine Started")

for (let i = 0; i < API_CONFIG.length; i++) {
const api = getNextAPI()

if (!api) continue

console.log("🔑 Using:", api.type)

let result = null

if (api.type === "gemini") result = await callGemini(api.key, prompt)
if (api.type === "groq") result = await callGroq(api.key, prompt)
if (api.type === "openrouter") result = await callOpenRouter(api.key, prompt)
if (api.type === "huggingface") result = await callHF(api.key, prompt)

if (result && result.length > 100) {
  console.log("✅ Success:", api.type)
  return result.trim()
}

}

console.log("❌ All APIs failed")
return null
}

// 🔁 RETRY
export async function generateWithRetry(prompt, retries = 2) {
for (let i = 0; i < retries; i++) {
const res = await generateAIContent(prompt)

if (res) return res

console.log("🔁 Retry:", i + 1)
await new Promise(r => setTimeout(r, 20000))
}
return null
}
