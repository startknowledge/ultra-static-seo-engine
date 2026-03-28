import fs from "fs"

export function runClusterEngine() {

  console.log("🧠 Clustering Keywords...")

  const file = "data/keywords.json"

  if (!fs.existsSync(file)) return

  const keywords = JSON.parse(fs.readFileSync(file))

  let clusters = {}

  keywords.forEach(k => {
    const main = k.split(" ").slice(-1)[0]

    if (!clusters[main]) clusters[main] = []
    clusters[main].push(k)
  })

  fs.writeFileSync("data/clusters.json", JSON.stringify(clusters, null, 2))

  console.log("✅ Clusters Created")
}