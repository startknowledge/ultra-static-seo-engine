export async function fetchTrends(niche = "") {

  console.log("📈 Fetching REAL Trends...")

  try {

    // 🔥 INDIA TRENDS
    const indiaRes = await fetch(
      "https://trends.google.com/trending/rss?geo=IN"
    )
    const indiaXML = await indiaRes.text()

    // 🔥 GLOBAL TRENDS
    const globalRes = await fetch(
      "https://trends.google.com/trending/rss?geo=US"
    )
    const globalXML = await globalRes.text()

    const parse = (xml) => {
      const matches = [...xml.matchAll(/<title>(.*?)<\/title>/g)]
      return matches
        .map(m => m[1])
        .filter(t => t && !t.includes("Daily Search Trends"))
    }

    let trends = [
      ...parse(indiaXML),
      ...parse(globalXML)
    ]

    // 🔥 OPTIONAL NICHE MIX
    if (niche) {
      trends = trends.map(t => `${t} ${niche}`)
    }

    // 🔥 REMOVE DUPLICATES
    trends = [...new Set(trends)]

    console.log("✅ Trends:", trends.length)

    return trends.slice(0, 50)

  } catch (e) {
    console.log("⚠️ Using fallback trends")

    // 🔥 SMART FALLBACK
    return [
      "latest news",
      "trending topics",
      "breaking news",
      "technology updates",
      "online business tips"
    ]
  }
}