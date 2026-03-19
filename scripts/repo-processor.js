import fs from "fs"
import { execSync } from "child_process"

// core
import { generateBlogs } from "./generator-blog.js"
import { generatePages } from "./generator-pages.js"
import { generateLinks } from "./link-engine.js"
import { generateSEOFiles } from "./seo-engine.js"

// phase 4
import { detectNiche } from "./niche-engine.js"
import { generateKeywords } from "./keyword-engine.js"
import { crawlCheck } from "./crawl-engine.js"

// phase 6
import { createBacklinks } from "./backlink-engine.js"
import { simulateTraffic } from "./traffic-engine.js"
import { interlinkNetwork } from "./network-engine.js"
import { pingSearchEngines } from "./ping-engine.js"

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
generateLinks()
generateSEOFiles()

// ================= SEO FIX =================
crawlCheck()

// ================= NETWORK (PHASE 6) =================
createBacklinks()
interlinkNetwork()
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

}

// ================= CLEAN =================
process.chdir("../")
cleanDir(temp)

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