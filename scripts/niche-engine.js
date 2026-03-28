export function detectNiche(repoName = "", content = "") {

  const repo = repoName.toLowerCase()

  // 🔥 auto extract words from repo name
  let words = repo.split("/").pop().replace(/-/g, " ").split(" ")

  // remove useless words
  const stopWords = ["repo","project","site","app","engine","tool"]

  words = words.filter(w => !stopWords.includes(w))

  // 🔥 return dynamic niche
  return words.slice(0, 2).join(" ") || "general"
}