import axios from "axios"

export async function runStrategy() {
  console.log("📊 Fetching REAL Trends...")

  try {
    const res = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_trends",
        api_key: process.env.SERP_API_KEY,
        geo: "IN"
      }
    })

    const trends = res.data.trending_searches_days?.[0]?.trending_searches || []

    if (!trends.length) throw new Error("No trends")

    const random = trends[Math.floor(Math.random() * trends.length)]

    const keyword = random.title.query

    const cluster = [
      keyword,
      `${keyword} guide`,
      `${keyword} tips`,
      `${keyword} tools`,
      `${keyword} for beginners`
    ]

    return {
      niche: keyword,
      cluster,
      source: "google_trends",
      createdAt: new Date().toISOString()
    }

  } catch (err) {
    console.log("⚠️ Trend API failed, fallback...")

    return {
      niche: "latest trending topic",
      cluster: ["trending topic guide"]
    }
  }
}