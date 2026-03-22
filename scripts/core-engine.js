import { processRepo } from "./repo-processor.js"
import { getAllRepos } from "./get-all-repos.js"
import { generateBlogs } from "./generator-blog.js"
import { runLinkEngine } from "./link-engine.js"
import clusters from "../data/keyword-cluster.json" assert { type: "json" }

const TOKEN = process.env.DETECT_REPO_TOKEN

// ================= CONFIG =================
const CONFIG = {
  MAX_REPOS: 50,
  RETRY: 2
}

// ================= LOGGER =================
function log(type, msg){
  console.log(`[${type}] ${msg}`)
}

// ================= SAFE EXEC =================
async function safeProcess(repo){

  for(let i=0;i<CONFIG.RETRY;i++){
    try{
      const result = await processRepo(repo)
      return result !== false
    }catch(err){
      log("RETRY", `${repo} attempt ${i+1}`)
    }
  }

  log("FAIL", repo)
  return false
}

// ================= FILTER =================
function filterRepos(repos){
  return repos
    .filter(r => !r.includes("ultra-static-seo-engine"))
    .slice(0, CONFIG.MAX_REPOS)
}

// ================= MAIN =================
export async function runCore(){

  console.log("🚀 Core Engine Start")

  // 🔥 STEP 1: Cluster-based blog generation
  for(const topic in clusters){

    const keywords = clusters[topic]

    log("CLUSTER", topic)

    await generateBlogs(topic, keywords)
  }

  // 🔥 STEP 2: Internal linking
  runLinkEngine()

  // 🔥 STEP 3: Repo automation
  if(!TOKEN){
    throw new Error("❌ Missing GitHub Token")
  }

  log("START","Repo Processing...")

  const repos = await getAllRepos()
  const filtered = filterRepos(repos)

  log("INFO",`Total repos: ${filtered.length}`)

  let success = 0
  let failed = 0

  for(const repo of filtered){

    log("PROCESS", repo)

    const ok = await safeProcess(repo)

    if(ok) success++
    else failed++
  }

  // 🔥 FINAL LOG
  console.log("✅ Core Engine Done")
  log("RESULT",`Success: ${success}`)
  log("RESULT",`Failed: ${failed}`)
}

// ================= AUTO RUN =================
if (process.argv[1].includes("core-engine.js")) {
  runCore()
}