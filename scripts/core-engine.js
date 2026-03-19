import { generateBlogs } from "./generator-blog.js"
import { generatePages } from "./generator-pages.js"
import { generateLinks } from "./link-engine.js"
import { generateSEOFiles } from "./seo-engine.js"
import { generateSitemap } from "./generate-sitemap.js"
import { generateRSS } from "./generate-rss.js"

async function run(){

console.log("🚀 PHASE 1 + 2 START")

await generateBlogs()
await generatePages()
generateLinks()
generateSEOFiles()
generateSitemap()
generateRSS()

console.log("✅ SYSTEM COMPLETE")

}

run()