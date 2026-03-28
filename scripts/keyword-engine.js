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
  trends.forEach(t => keywords.add(t))

  // 🔥 intent expansion
  for (let t of trends) {
    for (let i of intents) {
      keywords.add(`${i} ${t}`)
    }
  }

  return Array.from(keywords).slice(0, 50)
}