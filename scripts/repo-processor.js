import fs from "fs"
import { execSync } from "child_process"

// core
import { generateBlogs } from "../scripts/generator-blog.js"
import { generatePages } from "../scripts/generator-pages.js"
import { runLinkEngine } from "../scripts/link-engine.js"
import { generateSEOFiles } from "../scripts/seo-engine.js"
import map from "../data/content-map.json" with { type: "json" }

// phase 4
import { detectNiche } from "../scripts/niche-engine.js"
import { expand as aiKeywords } from "../ai/keyword-engine.js"
import { generateKeywords as baseKeywords } from "../scripts/keyword-engine.js"
import { crawlCheck } from "../scripts/crawl-engine.js"

// phase 6
import { createBacklinks } from "../scripts/backlink-engine.js"
import { simulateTraffic } from "../scripts/traffic-engine.js"
import { pingSearchEngines } from "../scripts/ping-engine.js"

const TOKEN = process.env.DETECT_REPO_TOKEN

function cleanDir(dir){
  if(fs.existsSync(dir)){
    execSync(`rm -rf ${dir}`)
  }
}

export async function processRepo(repo){

  const slug = repo.toLowerCase().replace(/[^a-z0-9]/g,"-")
  //TEMP CLEAN
  const temp = `temp-${repo.replace("/","-")}`

    // ✅ CLEAN BEFORE CLONE
    if(fs.existsSync(temp)){
      execSync(`rm -rf ${temp}`)
    }
  // ❌ duplicate रोकना
  if(map[slug]){
    console.log("⏩ Skip existing:", slug)
    return false
  }

  try{

    console.log("⚙️ Processing:", repo)

    // ================= CLONE =================
    execSync(
      `git clone https://${TOKEN}@github.com/${repo}.git ${temp}`,
      {stdio:"inherit"}
    )

    process.chdir(temp)

    // ================= TEMPLATE =================
    if(!fs.existsSync("templates")){
      fs.cpSync("../templates","templates",{recursive:true})
      console.log("📦 Templates injected")
    }

    // ================= SAMPLE =================
    const contentSample = fs.existsSync("index.html")
      ? fs.readFileSync("index.html","utf8")
      : ""

    // ================= NICHE =================
    const niche = detectNiche(repo, contentSample)

    const base = baseKeywords(niche)
    const extra = await aiKeywords(niche)

    const keywords = [...new Set([
      ...(Array.isArray(base) ? base : []),
      ...(Array.isArray(extra) ? extra : [])
    ])]

    console.log("🧠 Niche:", niche)
    console.log("📊 Keywords:", keywords)

    // ================= STRUCTURE =================
    if(!fs.existsSync("blog")) fs.mkdirSync("blog")
    if(!fs.existsSync("pages")) fs.mkdirSync("pages")

    // ================= GENERATE =================
    await generateBlogs(niche, keywords)
    await generatePages()

    runLinkEngine()
    generateSEOFiles()

    // ================= SEO =================
    crawlCheck()

    // ⚠️ OPTIONAL (RECOMMENDED OFF)
    // simulateTraffic() ❌ risky
    // createBacklinks() ⚠️ control karo

    pingSearchEngines()

    // ================= SAVE MAP =================
    map[slug] = {
      pillar: `/pages/${slug}.html`,
      blogs: []
    }

    fs.writeFileSync(
    `${process.cwd()}/../data/content-map.json`,
    JSON.stringify(map, null, 2)
    )

    // ================= PUSH =================
    execSync(`
      git config user.name "seo-bot"
      git config user.email "bot@seo.com"
      git add .
      git commit -m "🚀 auto seo update" || echo "No changes"
      git push
    `)

  }catch(err){
    console.log("❌ ERROR:", repo, err.message)
    return false
  }

  // ================= CLEAN =================
  process.chdir("../")
  cleanDir(temp)

  return true
}

// ================= RUN =================
export async function runRepoProcessor(){
  console.log("⚙️ Repo processing...")
}

// auto run
if (process.argv[1].includes("repo-processor.js")) {
  runRepoProcessor()
}