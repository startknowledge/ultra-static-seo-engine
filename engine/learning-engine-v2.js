import fs from "fs"

export async function updateLearning(strategy, blogs) {
  const path = "./data/performance.json"

  let data = fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path))
    : {}

  data[strategy.niche] = {
    posts: blogs.length,
    lastUpdated: new Date().toISOString()
  }

  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}