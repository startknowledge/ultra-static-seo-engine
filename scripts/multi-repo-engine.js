import { getAllRepos } from "./get-all-repos.js"
import { processRepo } from "./repo-processor.js"

const CONFIG = {
  BATCH_SIZE: 3,
  DELAY: 5000,
  RETRY: 2
}

function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

async function safeProcess(repo){

  for(let i=0;i<CONFIG.RETRY;i++){
    try{
      return await processRepo(repo)
    }catch(e){
      console.log("🔁 Retry:", repo)
      await sleep(3000)
    }
  }

  console.log("❌ Failed:", repo)
  return false
}

export async function runMultiRepo(){

  console.log("🚀 PHASE 6 Start")

  const repos = await getAllRepos()

  let success = 0
  let failed = 0

  for(let i=0;i<repos.length;i+=CONFIG.BATCH_SIZE){

    const batch = repos.slice(i, i + CONFIG.BATCH_SIZE)

    for(const repo of batch){

      const ok = await safeProcess(repo)

      ok ? success++ : failed++

      await sleep(3000)
    }

    console.log(`📊 ${success} success / ${failed} failed`)

    await sleep(CONFIG.DELAY)
  }

  console.log("🎯 Final:", {success, failed})
}

if (process.argv[1].includes("multi-repo-engine.js")) {
  runMultiRepo()
}