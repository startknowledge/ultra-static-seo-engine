import fs from "fs"
import { execSync } from "child_process"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getAllRepos } from "./get-all-repos.js"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY1)

// ================== HELPERS ==================

function slugify(text){
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g,"-")
}

function readRepoContent(path){
  let content = ""

  const files = fs.readdirSync(path)

  files.forEach(file => {
    if(file.endsWith(".html") || file.endsWith(".md")){
      content += fs.readFileSync(`${path}/${file}`, "utf8").slice(0, 2000)
    }
  })

  return content.slice(0, 5000)
}

async function detectNicheKeywords(content){

  const prompt = `
Analyze website content and return:

{
"niche":"...",
"keywords":["10 trending keywords"]
}

Rules:
- SEO optimized
- trending topics
- based on content
- return ONLY JSON

Content:
${content}
`

  const model = genAI.getGenerativeModel({
    model:"gemini-2.5-flash"
  })

  const res = await model.generateContent(prompt)
  const raw = await res.response.text()

  try{
    return JSON.parse(raw)
  }catch{
    console.log("❌ niche detect fail")
    return null
  }
}

// ================== MAIN ==================

async function run(){

const repos = await getAllRepos()

for(const repo of repos){

console.log("🚀 Processing:", repo)

// clone
execSync(`git clone https://${process.env.GITHUB_TOKEN}@github.com/${repo}.git temp-site`)

// read content
const content = readRepoContent("./temp-site")

if(!content){
  console.log("❌ No content, skipping")
  execSync("rm -rf temp-site")
  continue
}

// detect niche + keywords
const data = await detectNicheKeywords(content)

if(!data){
  execSync("rm -rf temp-site")
  continue
}

console.log("📊 Niche:", data.niche)

// read prompt
const promptTemplate = fs.readFileSync("./prompts/blog-prompt.txt","utf8")

for(const keyword of data.keywords){

const prompt = promptTemplate
.replace(/{{keyword}}/g, keyword)
.replace(/{{niche}}/g, data.niche)

// generate blogs
const model = genAI.getGenerativeModel({
model:"gemini-2.5-flash"
})

const result = await model.generateContent(prompt)
const raw = await result.response.text()

let blogs
try{
blogs = JSON.parse(raw)
}catch{
console.log("❌ blog JSON fail")
continue
}

// ensure blog folder
if(!fs.existsSync("./temp-site/blog")){
  fs.mkdirSync("./temp-site/blog")
}

// save blogs
for(const blog of blogs){

const slug = slugify(blog.title)

fs.writeFileSync(
`temp-site/blog/${slug}.html`,
blog.content
)

console.log("✅", slug)
}

}

// push back
execSync(`
cd temp-site
git add .
git commit -m "auto AI blogs"
git push
`)

// cleanup
execSync("rm -rf temp-site")

}

}

run()