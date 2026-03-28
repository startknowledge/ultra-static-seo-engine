import fs from "fs"

export async function fetchTrends(niche) {

  console.log("📈 Fetching REAL Trends...")

  const url = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US"

  let trends = []

  try {
    const res = await fetch(url)
    const text = await res.text()

    const matches = [...text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]

    trends = matches
      .map(m => m[1].toLowerCase())
      .filter(t => t !== "google trends" && !t.includes("404")) // 🔥 FIX

  } catch (e) {
    console.log("⚠️ RSS failed")
  }

  // 🔥 NO niche filtering (important)
  if (trends.length === 0) {
    const trends = [
  `${niche} tools`,
  `${niche} trends`,
  `${niche} strategy`,
  `${niche} automation`,

  // 🔥 growth & traffic
  `${niche} growth`,
  `${niche} tips`,
  `${niche} hacks`,
  `${niche} secrets`,
  `${niche} ideas`,
  `${niche} methods`,

  // 🚀 learning / guides
  `${niche} guide`,
  `${niche} tutorial`,
  `${niche} course`,
  `${niche} basics`,
  `${niche} for beginners`,
  `${niche} advanced`,

  // 💰 monetization
  `${niche} earning`,
  `${niche} make money`,
  `${niche} income`,
  `${niche} business`,
  `${niche} side hustle`,
  `${niche} profit`,

  // ⚡ tools / software
  `best ${niche} tools`,
  `top ${niche} tools`,
  `free ${niche} tools`,
  `${niche} software`,
  `${niche} platforms`,
  `${niche} apps`,

  // 📈 comparison
  `${niche} vs`,
  `${niche} alternatives`,
  `${niche} comparison`,
  `best ${niche}`,
  `top ${niche}`,

  // 📅 time based
  `${niche} 2026`,
  `latest ${niche}`,
  `new ${niche}`,
  `${niche} future`,
  `${niche} updates`,
  `${niche} today`,

  // 🎯 problem solving
  `${niche} mistakes`,
  `${niche} problems`,
  `${niche} solutions`,
  `${niche} fix`,
  `${niche} improve`,
  `${niche} optimize`,

  // 🧠 deep / authority content
  `${niche} case study`,
  `${niche} examples`,
  `${niche} checklist`,
  `${niche} framework`,
  `${niche} blueprint`,
  `${niche} roadmap`
]
  }

  if (!fs.existsSync("data")) fs.mkdirSync("data")

  fs.writeFileSync("data/trends.json", JSON.stringify({ [niche]: trends }, null, 2))

  console.log("✅ Trends:", trends.length)

  return trends
}