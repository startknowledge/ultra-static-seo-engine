import { generateBlog } from "./generator-blog.js"

const keywords = [
  { keyword: "SEO 2026", traffic: 100 },
  { keyword: "best SEO tools", traffic: 80 },
  { keyword: "AI blogging", traffic: 70 },
  { keyword: "affiliate marketing 2026", traffic: 60 },
  { keyword: "make money online", traffic: 90 }
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