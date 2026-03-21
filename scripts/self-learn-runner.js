import fs from "fs"
import { selfLearn } from "../ai/self-learning.js"

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
      const improved = await selfLearn(html)

      fs.writeFileSync(path, improved)

      console.log("🧠 AI Improved:", file)

    }catch(err){
      console.log("❌ Learn error:", file)
    }
  }
}

run()