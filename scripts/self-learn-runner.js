import fs from "fs"
import { learn } from "../ai/self-learning.js"

const BLOG_DIR = "./blog"

async function run() {

  if(!fs.existsSync(BLOG_DIR)){
    console.log("❌ Blog folder missing")
    return
  }

  const files = fs.readdirSync(BLOG_DIR)

  for (const file of files) {

    if(!file.endsWith(".html")) continue

    const path = `${BLOG_DIR}/${file}`

    let html = fs.readFileSync(path, "utf-8")

    if(html.length < 500){
      console.log("⚠️ Skip low content:", file)
      continue
    }

    try{
      // simple learning (Phase 6 stable)
      learn(file, true)
      console.log("🧠 Learning updated:", file)
    }catch(err){
      console.log("🧠 Learn error:", file)
      }
  }
}
// auto run
if (process.argv[1].includes("self-learn-runner.js")) {
  run()
}