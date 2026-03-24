import { calculateAuthority } from "./authority-engine.js"
import { AUTHORITY_THRESHOLD } from "../config.js"

export function runLearningEngine(pages = []) {
  const rewriteQueue = []
  const expandQueue = []

  for (const p of pages) {
    const result = calculateAuthority(p)

    if (result.score < AUTHORITY_THRESHOLD) {
      rewriteQueue.push(result)
    } else {
      expandQueue.push(result)
    }
  }

  return { rewriteQueue, expandQueue }
}