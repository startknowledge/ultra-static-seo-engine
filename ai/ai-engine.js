const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4
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

// 🔥 MAIN AI CALL
export async function generateAIContent(prompt) {
  const API_KEY = getKey()

  if (!API_KEY) return null

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
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

// 🔁 RETRY SYSTEM (SMART)
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