import fs from "fs"

export async function fetchTrends(){

  console.log("📈 Fetching Trends...")

  const data = {
    seo: [
      "seo trends 2026",
      "ai seo tools",
      "google ranking update",
      "seo automation"
    ],
    "artificial intelligence": [
      "best ai tools 2026",
      "ai content generator",
      "chatgpt alternatives"
    ]
  }

  if(!fs.existsSync("data")){
    fs.mkdirSync("data")
  }

  fs.writeFileSync("data/trends.json", JSON.stringify(data,null,2))

  console.log("✅ Trends Saved")
}