const API_KEYS = [
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
].filter(Boolean)

let keyIndex = 0

function getKey() {
  if (API_KEYS.length === 0) {
    console.log("❌ No Gemini API keys found")
    return null
  }

  const key = API_KEYS[keyIndex % API_KEYS.length]
  keyIndex++
  return key
}

// 🔥 MAIN AI CALL (FIXED)
export async function generateAIContent(prompt) {
  const API_KEY = getKey()
  if (!API_KEY) return null

  // ✅ NEW WORKING MODEL
  const model = "gemini-2.0-flash"

  // ✅ NEW ENDPOINT (IMPORTANT)
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`

  // 🔥 DEBUG LOGS (YAHI ADD KARNA THA)
  console.log("🔑 Using Key:", API_KEY?.slice(0, 10))
  console.log("🌐 URL:", url)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.log("⚠️ Gemini API Error:", data)
      return null
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      null

    if (!text) {
      console.log("⚠️ Empty AI response")
      return null
    }

    return text.trim()

  } catch (err) {
    console.log("⚠️ Gemini Fetch Error:", err.message)
    return null
  }
}

// 🔁 RETRY SYSTEM
export async function generateWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const result = await generateAIContent(prompt)

    if (result && result.length > 100) {
      return result
    }

    console.log(`🔁 Retry ${i + 1}/${retries}`)
  }

  console.log("❌ AI failed after retries")
  return null
}