import { getAllRepos } from "./get-all-repos.js"
import { processRepo } from "./repo-processor.js"

const CONFIG = {
  BATCH_SIZE: 5,
  DELAY: 5000, // 5 sec gap (avoid API overload)
  RETRY: 2
}

function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

async function safeProcess(repo){

  for(let i=0;i<CONFIG.RETRY;i++){
    try{
      const ok = await processRepo(repo)
      return ok
    }catch(e){
      console.log("🔁 Retry:", repo)
    }
  }

  console.log("❌ Failed:", repo)
  return false
}

export async function runMultiRepo(){

  console.log("🚀 PHASE 6: Multi Repo Engine Start")

  const repos = await getAllRepos()

  console.log("📦 Total repos:", repos.length)

  let success = 0
  let failed = 0

  for(let i=0;i<repos.length;i+=CONFIG.BATCH_SIZE){

    const batch = repos.slice(i, i + CONFIG.BATCH_SIZE)

    console.log(`⚡ Batch ${i / CONFIG.BATCH_SIZE + 1}`)

    const results = await Promise.all(
      batch.map(repo => safeProcess(repo))
    )

    results.forEach(r => r ? success++ : failed++)

    console.log(`📊 Progress: ${success} success / ${failed} failed`)

    await sleep(CONFIG.DELAY)
  }

  console.log("✅ Multi Repo Done")
  console.log("🎯 Final:", {success, failed})
}

// auto run
if (process.argv[1].includes("multi-repo-engine.js")) {
  runMultiRepo()
}