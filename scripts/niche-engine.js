import fs from "fs"

export function detectNiche(repoName, content){

let niche = "technology"

if(repoName.includes("seo")) niche = "seo"
else if(repoName.includes("tool")) niche = "tools"
else if(repoName.includes("ai")) niche = "artificial intelligence"
else if(content.includes("html")) niche = "web development"

return niche
}