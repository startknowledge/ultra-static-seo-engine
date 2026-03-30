import axios from "axios"

// 🔑 MULTI KEYS
const KEYS = [
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

let index = 0

function getKey() {
  if (!KEYS.length) return null
  return KEYS[index++ % KEYS.length]
}

// 🔁 RETRY SYSTEM
async function callGemini(prompt, retries = 3) {
  const key = getKey()

  if (!key) {
    console.log("❌ No API Key")
    return ""
  }

  try {
    const res = await axios.post(
  `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
  {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  }
)

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

  } catch (err) {
    console.log("⚠️ Gemini Error:", err.response?.status || err.message)

    if (retries > 0) {
      console.log("🔁 Retrying...")
      return await callGemini(prompt, retries - 1)
    }

    return ""
  }
}

// 🚀 EXPORT
export async function generateAIContent(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const key = getKey()

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      )

      const text =
        res.data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) return text

    } catch (err) {
      console.log("⚠️ Gemini Error:", err.response?.status)

      if (attempt < 3) console.log("🔁 Retrying...")
    }
  }

  // 🔥 fallback content (VERY IMPORTANT)
  return `<p>This article covers ${prompt}. Stay tuned for detailed insights.</p>`
}