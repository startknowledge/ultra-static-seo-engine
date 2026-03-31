const API_KEYS = [
process.env.GEMINI_API_KEY3,
process.env.GEMINI_API_KEY4,
process.env.GEMINI_API_KEY1,
process.env.GEMINI_API_KEY2,
process.env.OPENAI_OPENROUTER1,
process.env.GROQ_API1,
process.env.HUGGINGFACE_TOKEN1
].filter(Boolean)

let keyIndex = 0

function getKey() {
if (API_KEYS.length === 0) {
console.log("❌ No API keys found")
return null
}

const key = API_KEYS[keyIndex % API_KEYS.length]
keyIndex++
return key
}

// 🔍 DETECT PROVIDER FROM KEY NAME (IMPORTANT)
function detectProvider(key) {
if (!key) return null

if (key.startsWith("AIza")) return "gemini"
if (key.startsWith("gsk_")) return "groq"
if (key.startsWith("hf_")) return "huggingface"
if (key.startsWith("sk-") || key.startsWith("or-")) return "openrouter"

return null
}

// 🔥 GEMINI
async function callGemini(key, prompt) {
const model = "gemini-2.0-flash"

const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`

const res = await fetch(url, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
contents: [{ parts: [{ text: prompt }] }]
})
})

const data = await res.json()

if (!res.ok) {
console.log("⚠️ Gemini Error:", data?.error?.code)
return null
}

return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
}

// 🔥 GROQ
async function callGroq(key, prompt) {
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
}

// 🔥 OPENROUTER
async function callOpenRouter(key, prompt) {
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
}

// 🔥 HUGGINGFACE
async function callHF(key, prompt) {
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
}

// 🚀 MAIN ENGINE (SMART ROTATION)
export async function generateAIContent(prompt) {
console.log("🧠 Smart Multi-AI Started")

for (let i = 0; i < API_KEYS.length; i++) {
const key = getKey()
const provider = detectProvider(key)

console.log("🔑 Using:", provider)

if (!provider) continue

try {
  let result = null

  if (provider === "gemini") result = await callGemini(key, prompt)
  if (provider === "groq") result = await callGroq(key, prompt)
  if (provider === "openrouter") result = await callOpenRouter(key, prompt)
  if (provider === "huggingface") result = await callHF(key, prompt)

  if (result && result.length > 100) {
    console.log("✅ Success:", provider)
    return result.trim()
  }

} catch (err) {
  console.log("⚠️ Error:", provider, err.message)
}

}

console.log("❌ All APIs failed")
return null
}

// 🔁 RETRY SYSTEM (UNCHANGED STYLE)
export async function generateWithRetry(prompt, retries = 3) {
for (let i = 0; i < retries; i++) {
const result = await generateAIContent(prompt)

if (result && result.length > 100) {
  return result
}

console.log(`🔁 Retry ${i + 1}/${retries}`)

await new Promise(r => setTimeout(r, 30000))
}

console.log("❌ AI failed after retries")
return null
}
