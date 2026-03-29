import fetch from "node-fetch"

export async function fetchTrends(niche) {

  console.log("📈 Fetching REAL Trends...")

  try {

    // 🔥 GOOGLE TRENDS RSS (INDIA)
    const indiaRes = await fetch(
      "https://trends.google.com/trending/rss?geo=IN"
    )
    const indiaXML = await indiaRes.text()

    // 🔥 GLOBAL
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

    // 🔥 niche mix (IMPORTANT)
    trends = trends.map(t => `${t} ${niche}`)

    // remove duplicates
    trends = [...new Set(trends)]

    console.log("✅ Trends:", trends.length)

    return trends.slice(0, 50)

  } catch (e) {
    console.log("⚠️ Using fallback trends")
    return []
  }
}