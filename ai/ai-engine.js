import fetch from "node-fetch"

const API_KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4
]

let keyIndex = 0

function getKey() {
  const key = API_KEYS[keyIndex % API_KEYS.length]
  keyIndex++
  return key
}

export async function generateAIContent(prompt) {
  const API_KEY = getKey()

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
            parts: [{ text: prompt }]
          }
        ]
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(JSON.stringify(data))
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || null

  } catch (err) {
    console.log("⚠️ Gemini Error:", err.message)
    return null
  }
}
export async function generateWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await generateAIContent(prompt)

    if (res) return res

    console.log("🔁 Retrying...", i + 1)
  }

  return null
}