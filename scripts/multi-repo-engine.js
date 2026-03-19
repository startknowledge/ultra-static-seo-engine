import { getAllRepos } from "./get-all-repos.js"
import { processRepo } from "./repo-processor.js"

export async function runMultiRepo(){

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

if (process.argv[1].includes("multi-repo-engine.js")) {
 runMultiRepo()
}