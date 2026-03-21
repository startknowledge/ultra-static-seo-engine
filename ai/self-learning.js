import fs from "fs"

const FILE = "data/learning.json"

function load(){
  if(!fs.existsSync(FILE)) return {}
  return JSON.parse(fs.readFileSync(FILE,"utf8"))
}

function save(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2))
}

export function learn(keyword, success=true){

  const data = load()

  if(!data[keyword]){
    data[keyword] = {score:0}
  }

  data[keyword].score += success ? 1 : -1

  save(data)
}