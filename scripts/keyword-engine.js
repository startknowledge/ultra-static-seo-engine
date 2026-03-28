export function generateKeywords(niche, trends) {

  const intents = [
  "how to", "best", "top", "guide", "review", "tools",
  "software", "tips", "strategy", "tutorial",

  // 🔥 informational
  "what is", "why", "learn", "examples", "explained",
  "basics", "introduction", "overview", "meaning",
  "definition",

  // 🚀 transactional / buyer intent
  "buy", "price", "pricing", "discount", "deal",
  "offer", "cheap", "affordable", "premium",
  "subscription",

  // ⚡ comparison
  "vs", "comparison", "alternative", "alternatives",
  "compare", "which is better", "best vs", "top vs",

  // 📈 action / growth
  "fast", "easy", "quick", "step by step",
  "advanced", "pro", "expert", "secrets",
  "hacks", "growth",

  // 🛠 tools specific
  "free", "online", "generator", "checker",
  "calculator", "builder", "platform", "app",

  // 📅 time based
  "2026", "latest", "new", "updated", "trending",
  "future", "today",

  // 💰 monetization / business
  "earn", "make money", "income", "passive income",
  "business", "startup", "side hustle", "profit",

  // 🎯 problem solving
  "fix", "solve", "improve", "increase", "boost",
  "optimize", "reduce", "avoid", "mistakes",
  "issues"
]
  let keywords = new Set()

  // 🔥 direct trends
  trends.forEach(t => {
    if (t.length < 3) return
    keywords.add(t)

    intents.forEach(i => {
      keywords.add(`${i} ${t}`)
    })
  })

  return Array.from(keywords)
    .filter(k => !k.includes("404")) // 🔥 FIX
    .slice(0, 50)
}