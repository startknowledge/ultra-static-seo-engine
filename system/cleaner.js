import fs from "fs"

export async function runCleaner() {
  if (!fs.existsSync("./docs")) return

  const files = fs.readdirSync("./docs")

  files.forEach(f => {
    if (f.includes(":") || f.includes('"')) {
      fs.unlinkSync(`./docs/${f}`)
      console.log("❌ Removed invalid:", f)
    }
  })
}