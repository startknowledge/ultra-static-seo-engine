import fs from "fs"

export async function runStrategy() {
  const niches = ["seo", "ai tools", "make money online", "blogging"]

  const niche = niches[Math.floor(Math.random() * niches.length)]

  const cluster = [
    `best ${niche}`,
    `${niche} for beginners`,
    `${niche} tools`,
    `${niche} tips`,
    `${niche} guide`
  ]

  return { niche, cluster }
}