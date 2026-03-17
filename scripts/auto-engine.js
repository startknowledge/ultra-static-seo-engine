import fs from "fs"
import { execSync } from "child_process"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getAllRepos } from "./get-all-repos.js"

// ================== API KEYS ==================
const keys = [
  process.env.GEMINI_API_KEY1,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3
].filter(Boolean)

const key = keys[Math.floor(Math.random() * keys.length)]
const genAI = new GoogleGenerativeAI(key)
const detectRepoToken = process.env.DETECT_REPO_TOKEN
// ================== HELPERS ==================

function slugify(text){
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g,"")
    .replace(/\s+/g,"-")
}

// ✅ Safe JSON extractor (object based)
function extractJSONObject(text){
  try{
    const clean = text.replace(/```json|```/g,"").trim()
    const start = clean.indexOf("{")
    const end = clean.lastIndexOf("}")
    return JSON.parse(clean.substring(start, end+1))
  }catch{
    return null
  }
}

// ✅ Retry system
async function safeGenerate(model, prompt, retries=5){
  for(let i=0;i<retries;i++){
    try{
      return await model.generateContent(prompt)
    }catch(err){
      console.log(`⚠️ Retry ${i+1}`)
      await new Promise(r=>setTimeout(r, 2000*(i+1)))
    }
  }
  throw new Error("❌ Failed after retries")
}

// ✅ Read repo content
function readRepoContent(path){
  let content = ""

  if(!fs.existsSync(path)) return ""

  const files = fs.readdirSync(path)

  files.forEach(file=>{
    if(file.endsWith(".html") || file.endsWith(".md")){
      content += fs.readFileSync(`${path}/${file}`, "utf8").slice(0, 2000)
    }
  })

  return content.slice(0, 5000)
}

// ================== MAIN ==================

async function run(){

const repos = await getAllRepos()

for(const repo of repos){

  // ❌ Skip engine repo
  if(repo.includes("ultra-static-seo-engine")) continue

  console.log("🚀 Processing:", repo)

  const tempDir = `temp-${repo.replace("/", "-")}`

  try{

  // ================== CLONE ==================
  execSync(
    `git clone https://${detectRepoToken}@github.com/${repo}.git ${tempDir}`,
    { stdio:"inherit" }
  )

  // ================== READ CONTENT ==================
  const content = readRepoContent(tempDir)

  if(!content || content.length < 500){
    console.log("⚠️ Low content, skipping")
    execSync(`rm -rf ${tempDir}`)
    continue
  }

  // ================== LOAD FILES ==================
  const promptTemplate = fs.readFileSync("./prompts/blog-prompt.txt","utf8")
  const template = fs.readFileSync("./templates/blog-template.html","utf8")

  // ================== SINGLE AI CALL ==================
  const prompt = promptTemplate.replace(/{{content}}/g, content)

  const model = genAI.getGenerativeModel({
    model:"gemini-2.5-flash"
  })

  const result = await safeGenerate(model, prompt)
  const raw = await result.response.text()

  const data = extractJSONObject(raw)

  if(!data || !data.blogs){
    console.log("❌ JSON fail or no blogs")
    execSync(`rm -rf ${tempDir}`)
    continue
  }

  console.log("📊 Niche:", data.niche)

  // ================== BLOG FOLDER ==================
  if(!fs.existsSync(`${tempDir}/blog`)){
    fs.mkdirSync(`${tempDir}/blog`)
  }

  // ================== SAVE BLOGS ==================
  for(const blog of data.blogs){

    if(!blog.title || !blog.content) continue

    const slug = slugify(blog.title)

    // ❌ Skip duplicate
    if(fs.existsSync(`${tempDir}/blog/${slug}.html`)){
      console.log("⏩ Skip duplicate:", slug)
      continue
    }

    const html = template
      .replace(/{{title}}/g, blog.title)
      .replace(/{{description}}/g, blog.description || blog.title)
      .replace(/{{content}}/g, blog.content)

    fs.writeFileSync(`${tempDir}/blog/${slug}.html`, html)

    console.log("✅", slug)
  }

  // ================== GIT PUSH ==================
  execSync(`
cd ${tempDir}
git remote set-url origin https://${githubToken}@github.com/${repo}.git
git push origin main || git push origin master
`)

  }catch(err){
    console.log("❌ ERROR:", err.message)
  }

  // ================== CLEANUP ==================
  execSync(`rm -rf ${tempDir}`)

}

}

run()