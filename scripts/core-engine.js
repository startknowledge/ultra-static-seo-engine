import { generateBlog } from "./generator-blog.js"

const keywords = [
  { keyword: "SEO 2026", traffic: 50 },
  { keyword: "blogging tips", traffic: 10 }
]

async function run() {

  for (const k of keywords) {

    // ❌ skip low traffic
    if (k.traffic < 20) {
      console.log("⛔ Skipped:", k.keyword)
      continue
    }

    console.log("🚀 Generating:", k.keyword)

    await generateBlog(k)
  }
}

run()