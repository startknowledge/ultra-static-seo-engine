export async function generateWithClaude(keywordData) {

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.CLAUDE_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Write a blog about ${keywordData.keyword}`
        }
      ]
    })
  })

  const data = await res.json()

  return {
    title: keywordData.keyword,
    description: keywordData.keyword,
    content: data.content[0].text
  }
}