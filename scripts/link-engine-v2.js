import fs from "fs"
import topicalMap from "../data/topical-map.json" assert { type: "json" }

export function smartLinking(filePath) {
  let content = fs.readFileSync(filePath, "utf-8")

  for (const topic in topicalMap) {
    const pillar = topicalMap[topic].pillar

    if (!content.includes(pillar)) {
      content += `\n<a href="/${pillar}">Complete ${topic} guide</a>`
    }
  }

  fs.writeFileSync(filePath, content)
}