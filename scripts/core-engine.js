import { processRepo } from "./repo-processor.js"
import { getAllRepos } from "./get-all-repos.js"
import { generateBlogs } from "./generator-blog.js"
import { runLinkEngine } from "./link-engine.js"
import clusters from "../data/keyword-cluster.json" with { type: "json" }
const TOKEN = process.env.DETECT_REPO_TOKEN

// ================= CONFIG =================
const CONFIG = {
  MAX_REPOS: 50,
  RETRY: 2,
  CLUSTER_LIMIT: 2 // 🔥 limit for testing (avoid timeout)
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

  // 🔥 STEP 1: Controlled cluster execution (prevents timeout)
  const clusterKeys = Object.keys(clusters).slice(0, CONFIG.CLUSTER_LIMIT)

  for(const topic of clusterKeys){

    const keywords = clusters[topic]

    log("CLUSTER", topic)

    try{
      await generateBlogs(topic, keywords)
    }catch(err){
      log("ERROR", `Blog generation failed for ${topic}`)
    }
  }

  // 🔥 STEP 2: Internal linking (only if blogs exist)
  try{
    runLinkEngine()
  }catch(err){
    log("ERROR", "Link engine failed")
  }

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