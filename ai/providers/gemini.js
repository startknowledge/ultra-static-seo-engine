export async function generateWithGemini(keywordData) {

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Write a SEO optimized blog post about "${keywordData.keyword}" with headings, paragraphs, and conclusion.`
              }
            ]
          }
        ]
      })
    }
  )

  const data = await res.json()

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "AI failed"

  return {
    title: keywordData.keyword,
    description: keywordData.keyword,
    content: `<p>${text.replace(/\n/g, "</p><p>")}</p>`
  }
}