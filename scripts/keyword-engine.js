export function generateKeywords(niche) {

  const modifiers = [
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
   const keywords = []

  for (const m of modifiers) {
    keywords.push(`${m} ${niche}`)
  }

  const longTail = [
  `${niche} for beginners`,
  `${niche} step by step`,
  `${niche} complete guide`,
  `${niche} tools list`,
  `${niche} mistakes`,
  `${niche} case study`,
  `${niche} checklist`,
  `${niche} strategies 2026`,

  // 🔥 learning focused
  `${niche} explained`,
  `${niche} basics`,
  `${niche} full tutorial`,
  `${niche} course free`,
  `${niche} training guide`,
  `${niche} how it works`,

  // 🚀 growth / action
  `how to start ${niche}`,
  `how to learn ${niche}`,
  `how to master ${niche}`,
  `how to improve ${niche}`,
  `how to grow with ${niche}`,
  `${niche} tips for success`,

  // 💰 monetization
  `how to make money with ${niche}`,
  `${niche} income ideas`,
  `${niche} business model`,
  `${niche} side hustle ideas`,
  `${niche} earning methods`,

  // ⚡ tools specific
  `best ${niche} tools 2026`,
  `free ${niche} tools list`,
  `${niche} software list`,
  `${niche} apps for beginners`,
  `${niche} platforms comparison`,

  // 📈 comparison / decision
  `${niche} vs alternatives`,
  `best ${niche} vs competitors`,
  `${niche} comparison guide`,
  `which ${niche} is best`,
  `top ${niche} options`,

  // 📅 trending / freshness
  `latest trends in ${niche}`,
  `${niche} updates 2026`,
  `future of ${niche}`,
  `${niche} new strategies`,
  `${niche} trending topics`,

  // 🎯 problem solving
  `common ${niche} mistakes`,
  `how to fix ${niche} issues`,
  `${niche} problems and solutions`,
  `avoid mistakes in ${niche}`,
  `${niche} optimization tips`,

  // 🧠 authority content
  `${niche} expert guide`,
  `${niche} advanced strategies`,
  `${niche} pro tips`,
  `${niche} secrets revealed`,
  `${niche} best practices`
]
return [...keywords, ...longTail]
}