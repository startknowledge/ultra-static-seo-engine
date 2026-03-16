import fs from "fs"

const tools=JSON.parse(
fs.readFileSync("data/tool-topics.json")
)

const categories={}

tools.forEach(tool=>{

const cat=tool.split(" ")[0]

if(!categories[cat]){

categories[cat]=[]

}

categories[cat].push(tool)

})

fs.writeFileSync(
"data/categories.json",
JSON.stringify(categories,null,2)
)

console.log("Categories generated")
