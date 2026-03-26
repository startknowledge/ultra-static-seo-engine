import fs from "fs"

export function generateKeywords(niche){

  const trendsFile = "data/trends.json"

  if(fs.existsSync(trendsFile)){
    const trends = JSON.parse(fs.readFileSync(trendsFile,"utf-8"))

    if(trends[niche]){
      console.log("🔥 Using TREND keywords")
      return trends[niche]
    }
  }

  // fallback
  return [
    `${niche} 2026`,
    `best ${niche}`,
    `${niche} tools`,
    `how to ${niche}`,
    `${niche} guide`
  ]
}