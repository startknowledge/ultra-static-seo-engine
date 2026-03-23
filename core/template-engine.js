import fs from "fs"
import path from "path"

const GLOBALS = {
  SITE_LANG: process.env.SITE_LANG || "en",
  SITE_URL: process.env.SITE_URL || "",
  SITE_NAME: "StartKnowledge",
  year: new Date().getFullYear()
}

function safeRead(file){
  const full = path.resolve(file)
  if(!fs.existsSync(full)){
    console.log("❌ Missing:", file)
    return ""
  }
  return fs.readFileSync(full,"utf8")
}

function inject(template,data){
  return template.replace(/{{(.*?)}}/g,(_,key)=>{
    return data[key.trim()] ?? ""
  })
}

export function render(templatePath, data={}){

  let template = safeRead(templatePath)
  if(!template) return ""

  const finalData = {
    ...GLOBALS,
    ...data
  }

  // layout support
  if(template.includes("{{layout}}")){
    let layout = safeRead("templates/layout.html")
    template = template.replace("{{layout}}","")
    layout = layout.replace("{{content}}", template)
    template = layout
  }

  return inject(template, finalData)
}