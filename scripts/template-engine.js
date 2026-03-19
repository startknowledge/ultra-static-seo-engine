import fs from "fs"

export function render(path,data){

let template = fs.readFileSync(path,"utf8")

return template.replace(/{{(.*?)}}/g,(m,k)=>{
return data[k.trim()] || ""
})

}