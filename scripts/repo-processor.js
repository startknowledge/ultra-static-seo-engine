import fs from "fs"
import { execSync } from "child_process"

// core
import { generateBlogs } from "../scripts/generator-blog.js"
import { generatePages } from "../scripts/generator-pages.js"
import { runLinkEngine } from "../scripts/link-engine.js"
import { generateSEOFiles } from "../scripts/seo-engine.js"

// phase 4
import { detectNiche } from "../scripts/niche-engine.js"
import { expand as generateKeywords } from "../ai/keyword-engine.js"
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

const temp = `temp-${repo.replace("/","-")}`

try{

// ================= CLONE =================
execSync(
`git clone https://${TOKEN}@github.com/${repo}.git ${temp}`,
{stdio:"inherit"}
)

// ================= ENTER =================
process.chdir(temp)
// ================= TEMPLATE FIX =================
if(!fs.existsSync("templates")){
  fs.cpSync("../templates","templates",{recursive:true})
  console.log("📦 Templates injected")
}
// ================= READ =================
const contentSample = fs.existsSync("index.html")
? fs.readFileSync("index.html","utf8")
: ""

// ================= NICHE =================
const niche = detectNiche(repo, contentSample)
const keywords = generateKeywords(niche)

console.log("🧠 Niche:", niche)
console.log("📊 Keywords:", keywords)

// ================= STRUCTURE =================
if(!fs.existsSync("blog")){
fs.mkdirSync("blog")
}

if(!fs.existsSync("pages")){
fs.mkdirSync("pages")
}

// ================= GENERATE =================
await generateBlogs(niche, keywords)
await generatePages()
runLinkEngine()
generateSEOFiles()

// ================= SEO FIX =================
crawlCheck()

// ================= NETWORK (PHASE 6) =================
createBacklinks()
simulateTraffic()
pingSearchEngines()

// ================= INDEX =================
updateIndex()

// ================= PUSH =================
execSync(`
git config user.name "seo-bot"
git config user.email "bot@seo.com"
git add .
git commit -m "🚀 auto seo update"
git push
`)

}catch(err){
console.log("❌ ERROR:",repo,err.message)
return false
}

// ================= CLEAN =================
process.chdir("../")
cleanDir(temp)
}export async function runRepoProcessor(){

  console.log("⚙️ Repo processing...")

  runLinkEngine()

  console.log("✅ Repo processed")
}

// ================= INDEX =================
function updateIndex(){

let html = fs.existsSync("index.html")
? fs.readFileSync("index.html","utf8")
: baseIndex()

const blogs = fs.existsSync("blog")
? fs.readdirSync("blog")
: []

let list = ""

blogs.slice(0,10).forEach(file=>{
const slug = file.replace(".html","")
list += `<li><a href="/blog/${slug}.html">${slug}</a></li>`
})

html = html.replace("{{blogs}}",list)

fs.writeFileSync("index.html",html)
}

// ================= BASE =================
function baseIndex(){
return `
<!DOCTYPE html>
<html>
<head>
<title>SEO Engine</title>
<style>
body{font-family:sans-serif;background:#111;color:#fff}
a{color:#0af}
</style>
</head>
<body>

<h1>Auto SEO Site</h1>

<ul>
{{blogs}}
</ul>

</body>
</html>
`
}
// auto run
if (process.argv[1].includes("repo-processor.js")) {
  runRepoProcessor()
}