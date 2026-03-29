export async function generateWithOpenAI(keywordData) {

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Write a SEO optimized blog about ${keywordData.keyword}`
        }
      ]
    })
  })

  const data = await res.json()

  return {
    title: keywordData.keyword,
    description: keywordData.keyword,
    content: data.choices[0].message.content
  }
}