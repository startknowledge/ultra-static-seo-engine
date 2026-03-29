import axios from "axios"

const KEYS = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2
]

function getKey() {
  return KEYS[Math.floor(Math.random() * KEYS.length)]
}

export async function generateAIContent(prompt) {
  const apiKey = getKey()

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    }
  )

  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}