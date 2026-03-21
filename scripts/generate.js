import { generateBlogs } from "./generator-blog.js"

async function run(){

  console.log("🚀 Generating blogs...")

  await generateBlogs("general",["seo","ai","tools"])

  console.log("✅ Done")
}

run()