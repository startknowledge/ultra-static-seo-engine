import { analyzeCompetition } from "../core/competition-analyazer.js"
import { simulateRanking } from "../core/ranking-simulator.js"
import { predictTraffic } from "../core/traffic-predictor.js"
import { decide } from "../core/decision-engine.js"

// 🔥 seed from repo name (dynamic)
function getSeedFromRepo(repoName){
  return repoName
    .replace(/[-_]/g," ")
    .toLowerCase()
}

// 🔥 generate variations
function expandKeyword(seed){
  const modifiers = [
    "how to",
    "best",
    "guide",
    "tips",
    "tools",
    "2026",
    "free",
    "fast"
  ]

  let variations = []

  for(const mod of modifiers){
    variations.push(`${mod} ${seed}`)
    variations.push(`${seed} ${mod}`)
  }

  return variations
}

// 🔥 MAIN ENGINE
export function generateSmartKeywords(repoName){

  const seed = getSeedFromRepo(repoName)
  const candidates = expandKeyword(seed)

  let finalKeywords = []

  for(const keyword of candidates){

    const comp = analyzeCompetition(keyword)

    const ranking = simulateRanking({
      keyword,
      contentLength: 1200,
      domainAuthority: 20,
      backlinks: 2,
      seoScore: 50
    })

    const traffic = predictTraffic({
      searchVolume: 1000 + Math.random()*5000,
      position: ranking.estimatedPosition
    })

    const action = decide({
      difficulty: comp.difficulty,
      estimatedTraffic: traffic.estimatedTraffic,
      position: ranking.estimatedPosition
    })

    if(action === "PUBLISH"){
      finalKeywords.push(keyword)
    }
  }

  // shuffle
  finalKeywords = finalKeywords.sort(() => 0.5 - Math.random())

  return finalKeywords.slice(0, 50)
}