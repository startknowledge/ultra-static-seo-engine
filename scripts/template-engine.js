import fs from "fs"
import path from "path"

// ================= GLOBAL =================
const GLOBALS = {
  SITE_LANG: process.env.SITE_LANG || "en",
  SITE_URL: process.env.SITE_URL || "",
  SITE_NAME: "StartKnowledge",
  year: new Date().getFullYear()
}

// ================= SAFE READ =================
function safeRead(file){
  const full = path.resolve(file)
  if(!fs.existsSync(full)){
    console.log("❌ Missing:", file)
    return ""
  }
  return fs.readFileSync(full,"utf8")
}

// ================= NAVBAR =================
function getNavbar(){
  return `
  <a href="/">Home</a>
  <a href="/pages/about.html">About</a>
  <a href="/pages/contact.html">Contact</a>
  <a href="/sitemap.html">Sitemap</a>
  `
}

// ================= VARIABLE =================
function inject(template,data){
  return template.replace(/{{(.*?)}}/g,(_,key)=>{
    return data[key.trim()] ?? ""
  })
}

// ================= MAIN =================
export function render(templatePath, data={}){

  let template = safeRead(templatePath)

  if(!template) return ""

  const finalData = {
    ...GLOBALS,
    NAVBAR: getNavbar(),
    ...data
  }

  // 🔥 layout engine (FIXED)
  if(template.includes("{{layout}}")){

    let layout = safeRead("templates/layout.html")

    // 👉 replace layout placeholder with FULL template
    template = template.replace("{{layout}}","")

    layout = layout.replace("{{content}}", template)

    template = layout
  }

  return inject(template, finalData)
}

// debug
if (process.argv[1].includes("template-engine.js")) {
  console.log("✅ Template engine ready")
}