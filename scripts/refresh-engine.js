import fs from "fs"

export async function runRefreshEngine() {
  try {
    console.log("♻️ Refresh Engine Running...")

    const file = "data/posts.json"

    // CREATE FILE IF NOT EXISTS
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data")
    }

    if (!fs.existsSync(file)) {
      console.log("⚠️ posts.json not found → creating new")
      fs.writeFileSync(file, JSON.stringify([], null, 2))
      return
    }

    const raw = fs.readFileSync(file, "utf-8")
    const posts = JSON.parse(raw)

    console.log(`📄 Found ${posts.length} posts`)

    // Example update logic
    const updated = posts.map(p => ({
      ...p,
      updatedAt: new Date().toISOString()
    }))

    fs.writeFileSync(file, JSON.stringify(updated, null, 2))

    console.log("✅ Refresh Engine Updated Posts")

  } catch (err) {
    console.error("❌ Refresh Engine Error:", err.message)
  }
}