export async function runKeywordEvolution(){
  console.log("🔍 Keyword Evolution Running...")

  try {
    const baseKeywords = ["seo", "blogging", "affiliate marketing"]

    const evolved = baseKeywords.flatMap(keyword => [
      keyword,
      `${keyword} 2026`,
      `best ${keyword}`,
      `how to ${keyword} fast`
    ])

    console.log("📈 Keywords:", evolved)

  } catch (e) {
    console.log("❌ Keyword Evolution failed:", e.message)
  }
}