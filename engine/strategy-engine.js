import axios from "axios"

const KEYS = [
  process.env.SERP_API_KEY1,
  process.env.SERP_API_KEY2,
  process.env.SERP_API_KEY3
]

function getKey() {
  return KEYS[Math.floor(Math.random() * KEYS.length)]
}

export async function runStrategy() {
  console.log("📊 Fetching REAL Trends...")

  try {
    const apiKey = getKey()

    // 🔥 Google Trends
    const trendRes = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_trends",
        api_key: apiKey,
        geo: "IN"
      }
    })

    const trends = trendRes.data.trending_searches_days?.[0]?.trending_searches || []
    if (!trends.length) throw new Error("No trends")

    const random = trends[Math.floor(Math.random() * trends.length)]
    const mainKeyword = random.title.query

    // 🔥 Related Searches (REAL)
    const relatedRes = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: mainKeyword,
        api_key: apiKey
      }
    })

    const related =
      relatedRes.data.related_searches?.map(r => r.query) || []

    const cluster = [mainKeyword, ...related.slice(0, 5)]

    return {
      niche: mainKeyword,
      cluster,
      source: "live_google",
      createdAt: new Date().toISOString()
    }

  } catch (err) {
    console.log("❌ API failed:", err.message)

    return {
      niche: "fallback",
      cluster: ["latest topic"]
    }
  }
}