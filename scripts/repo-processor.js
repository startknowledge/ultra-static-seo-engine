import fs from "fs"
import { execSync } from "child_process"

import { generateBlogs } from "../scripts/generator-blog.js"
import { generatePages } from "../scripts/generator-pages.js"
import { runLinkEngine } from "../scripts/link-engine.js"
import { generateSEOFiles } from "../scripts/seo-engine.js"
import map from "../data/content-map.json" with { type: "json" }

import { detectNiche } from "../scripts/niche-engine.js"
import { expand as aiKeywords } from "../ai/keyword-engine.js"
import { generateKeywords as baseKeywords } from "../scripts/keyword-engine.js"
import { crawlCheck } from "../scripts/crawl-engine.js"

import { pingSearchEngines } from "../scripts/ping-engine.js"

const TOKEN = process.env.DETECT_REPO_TOKEN

function cleanDir(dir){
  if(fs.existsSync(dir)){
    execSync(`rm -rf ${dir}`)
  }
}

export async function processRepo(repo){

  const slug = repo.toLowerCase().replace(/[^a-z0-9]/g,"-")
  const temp = `temp-${repo.replace("/","-")}`

  if(fs.existsSync(temp)){
    execSync(`rm -rf ${temp}`)
  }

  if(map[slug]){
    console.log("♻️ Reprocessing:", slug)
  }

  const rootDir = process.cwd()

  try{

    console.log("⚙️ Processing:", repo)

    execSync(
      `git clone https://${TOKEN}@github.com/${repo}.git ${temp}`,
      {stdio:"inherit"}
    )

    process.chdir(temp)

    // ✅ TEMPLATE FIX
    if(!fs.existsSync("templates") && fs.existsSync(`${rootDir}/templates`)){
      fs.cpSync(`${rootDir}/templates`, "templates", {recursive:true})
    }

    const contentSample = fs.existsSync("index.html")
      ? fs.readFileSync("index.html","utf8")
      : ""

    const niche = detectNiche(repo, contentSample)

    const base = baseKeywords(niche)
    const extra = await aiKeywords(niche)

    const keywords = [...new Set([...(base||[]), ...(extra||[])])]

    if(!fs.existsSync("blog")) fs.mkdirSync("blog")
    if(!fs.existsSync("pages")) fs.mkdirSync("pages")

    await generateBlogs(niche, keywords)
    await generatePages()

    runLinkEngine()
    generateSEOFiles()

    crawlCheck()
    pingSearchEngines()

    map[slug] = {
      pillar: `/pages/${slug}.html`,
      blogs: []
    }

    // ✅ FIXED PATH
    fs.writeFileSync(
      `${rootDir}/data/content-map.json`,
      JSON.stringify(map, null, 2)
    )

    execSync(`
      git config user.name "seo-bot"
      git config user.email "bot@seo.com"
      git add .
      git commit -m "🚀 auto seo update" || echo "No changes"
      git push
    `)

  }catch(err){
    console.log("❌ ERROR:", repo, err.message)
    process.chdir(rootDir)
    cleanDir(temp)
    return false
  }

  process.chdir(rootDir)
  cleanDir(temp)

  return true
}