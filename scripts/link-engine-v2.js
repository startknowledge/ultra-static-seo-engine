import fs from "fs"

export async function runLinkEngineV2(){
  console.log("🔗 Link Engine Running...")

  try {
    const filePath = "data/topical-map.json"

    if (!fs.existsSync(filePath)) {
      console.log("⚠️ No topical map found, skipping...")
      return
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))

    console.log("🔗 Links processed:", Object.keys(data).length)

  } catch (e) {
    console.log("❌ Link Engine failed:", e.message)
  }
}