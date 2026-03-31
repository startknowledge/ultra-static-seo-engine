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
import { detectNewRepo, detectRepoContext } from "./repo-detector.js"
import { generateIndex } from "../content/index-generator.js"

export async function runUltraCore() {
  console.log("🚀 GOD-LEVEL SYSTEM STARTED")

  const isNewRepo = detectNewRepo()
  const context = detectRepoContext()

  if (!context) return

  console.log("🌐 DOMAIN:", context.domain)
  console.log("📂 CONTEXT:", context.niche)

  let strategy

  try {
    strategy = await runStrategy(context)
  } catch (err) {
    console.log("❌ STRATEGY ERROR:", err.message)
    return
  }

  if (isNewRepo) {
    console.log("🆕 New Repo → Trend Priority")
  }
  s
  await generateIndex(blogs)
  const blogs = await generateBlogs(strategy, context)
  const pages = await generatePages(strategy, context)

  await runInternalLinking(blogs, pages)

  await updateLearning({ repo: context.repo, blogs })

  await runCleaner()

  await generateSitemap(blogs, pages)
  await generateSchema(blogs, pages)

  await runGrowth(strategy)

  await deploy()

  console.log("🔥 SYSTEM COMPLETE")
}

runUltraCore()