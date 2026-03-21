import fs from "fs"
import { execSync } from "child_process"

import { processRepo } from "./repo-processor.js"
import { getAllRepos } from "./get-all-repos.js"
import { generateBlogs } from "./generator-blog.js"
import { runLinkEngine } from "./link-engine.js"

const TOKEN = process.env.DETECT_REPO_TOKEN

// ================= CONFIG =================
const CONFIG = {
  MAX_REPOS: 50,
  PARALLEL: false,
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

// ================= REPO FILTER =================
function filterRepos(repos){

  return repos
    .filter(r => !r.includes("ultra-static-seo-engine"))
    .slice(0, CONFIG.MAX_REPOS)

}

// ================= MAIN ENGINE =================
export async function runCore(){

  console.log("🚀 Core Engine Start")

  await generateBlogs("general",["seo","ai","tools"])

  runLinkEngine()

  console.log("✅ Core Engine Done")
  
  log("START","Ultra Core Engine Running...")

  if(!TOKEN){
    throw new Error("❌ Missing GitHub Token")
  }

  const repos = await getAllRepos()

  const filtered = filterRepos(repos)

  log("INFO",`Total repos: ${filtered.length}`)

  let success = 0
  let failed = 0

  for(const repo of filtered){

    log("PROCESS", repo)

    const ok = await safeProcess(repo)

    if(ok){
      success++
    }else{
      failed++
    }


  }

  log("DONE",`Success: ${success}`)
  log("DONE",`Failed: ${failed}`)

}

// ================= DIRECT RUN FIX =================
if (process.argv[1].includes("core-engine.js")) {
  runCore()
}