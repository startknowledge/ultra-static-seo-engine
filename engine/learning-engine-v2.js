import fs from "fs"

export async function updateLearning(strategy, blogs) {
  const path = "./data/performance.json"

  let data = {}
  if (fs.existsSync(path)) {
    data = JSON.parse(fs.readFileSync(path))
  }

  const score = Math.floor(Math.random() * 100)

  data[strategy.niche] = {
    posts: blogs.length,
    score
  }

  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}