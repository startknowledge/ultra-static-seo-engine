import fs from "fs"

const FILE = "./data/learning.json"

export function updateLearning(data) {
  let db = []

  try {
    if (fs.existsSync(FILE)) {
      const raw = fs.readFileSync(FILE, "utf-8")

      // 🔥 EMPTY FILE FIX
      if (raw && raw.trim().length > 0) {
        db = JSON.parse(raw)
      }
    }
  } catch (err) {
    console.log("⚠️ Learning DB corrupted → resetting")
    db = []
  }

  db.push({
    ...data,
    time: new Date().toISOString()
  })

  if (!fs.existsSync("./data")) fs.mkdirSync("./data")

  fs.writeFileSync(FILE, JSON.stringify(db, null, 2))
}