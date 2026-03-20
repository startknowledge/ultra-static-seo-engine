import fs from "fs"

const GLOBALS = {
  SITE_LANG: process.env.SITE_LANG || "en",
  SITE_URL: process.env.SITE_URL || "https://example.com"
}

export function render(templatePath, data = {}){

  let template = fs.readFileSync(templatePath, "utf8")

  // merge global + local
  const finalData = {
    SITE_LANG: process.env.SITE_LANG || "en",
    SITE_URL: process.env.SITE_URL || "",
    ...data
  }

  // layout support
  if(template.includes("{{layout}}")){

    let layout = fs.readFileSync("templates/layout.html","utf8")

    const content = data.content || ""

    layout = layout.replace("{{content}}", content)

    template = template.replace("{{layout}}", layout)
  }
  
  return template.replace(/{{(.*?)}}/g, (_, key)=>{
    return finalData[key.trim()] || ""
  })

}