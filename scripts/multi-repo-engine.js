import { getAllRepos } from "./get-all-repos.js"
import { processRepo } from "./repo-processor.js"

async function run(){

console.log("🚀 PHASE 3 START")

const repos = await getAllRepos()

for(const repo of repos){

// ❌ skip self repo
if(repo.includes("ultra-static-seo-engine")) continue

console.log("⚙️ Processing:",repo)

await processRepo(repo)

}

console.log("✅ ALL REPOS PROCESSED")

}

run()