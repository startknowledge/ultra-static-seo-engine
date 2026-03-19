import fs from "fs"

export function checkQuality(content){

if(!content || content.length < 1000){
return false
}

// simple duplication detection
const repeated = (content.match(/the/g)||[]).length

if(repeated > 200){
return false
}

return true
}