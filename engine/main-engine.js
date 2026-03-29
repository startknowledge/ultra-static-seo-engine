import { runStrategy } from "./strategy-engine.js"
import { generateBlogs } from "../content/blog-generator.js"
import { generatePages } from "../content/page-generator.js"
import { runInternalLinking } from "../seo/internal-linking.js"
import { updateLearning } from "./learning-engine-v2.js"
import { runGrowth } from "./growth-engine.js"
import { runCleaner } from "../system/cleaner.js"
import { generateSitemap } from "../seo/sitemap-engine.js"
import { generateSchema } from "../seo/schema-engine.js"
import { deploy } from "../system/deploy-engine.js"

export async function runUltraCore() {
  console.log("🚀 GOD-LEVEL SYSTEM STARTED")

  const strategy = await runStrategy()

  const blogs = await generateBlogs(strategy)
  const pages = await generatePages(strategy)

  await runInternalLinking(blogs, pages)

  await updateLearning(strategy, blogs)

  await runCleaner()

  await generateSitemap(blogs, pages)
  await generateSchema(blogs, pages)

  await runGrowth(strategy)

  await deploy()

  console.log("🔥 SYSTEM COMPLETE")
}