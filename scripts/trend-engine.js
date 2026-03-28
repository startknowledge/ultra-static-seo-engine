import fs from "fs"

export async function fetchTrends(niche) {

  console.log("📈 Fetching REAL Trends...")

  const url = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US"

  let trends = []

  try {
    const res = await fetch(url)
    const xml = await res.text()

    const matches = [...xml.matchAll(/<title>(.*?)<\/title>/g)]

    trends = matches.map(m => m[1].toLowerCase())

  } catch (e) {
    console.log("⚠️ Google Trends failed")
  }

  // 🔥 filter niche-related
  let filtered = trends.filter(t => t.includes(niche))

  // 🔥 fallback (still dynamic)
  if (filtered.length === 0) {
    filtered = trends.slice(0, 10)
  }

  if (!fs.existsSync("data")) fs.mkdirSync("data")

  fs.writeFileSync("data/trends.json", JSON.stringify({
    niche,
    trends: filtered
  }, null, 2))

  console.log("✅ Trends:", filtered.length)

  return filtered
}