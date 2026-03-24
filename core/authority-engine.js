import fs from "fs"

export function calculateAuthority(pagePath) {
  const content = fs.readFileSync(pagePath, "utf-8")

  const links = (content.match(/<a /g) || []).length
  const words = content.split(/\s+/).length

  const score =
    links * 2 +
    words / 500 +
    10 + // freshness placeholder
    10   // keyword coverage placeholder

  return {
    page: pagePath,
    score: Math.round(score),
    level: score > 80 ? "high" : score > 50 ? "medium" : "low"
  }
}
export async function runAuthorityEngine(){
  console.log("🏆 Authority Engine Running...")

  try {
    // future: build topical authority, pillar pages, etc.

  } catch (e) {
    console.log("❌ Authority Engine failed:", e.message)
  }
}