import fs from "fs"
import path from "path"

// ================= SAFE SLUG =================
function cleanText(text){
  return text
    .replace(/[^a-z0-9\s\-]/gi, "")
    .slice(0, 60)
}

// ================= SVG GENERATOR =================
function createSVG(text){

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#g)"/>

  <text 
    x="50%" 
    y="50%" 
    dominant-baseline="middle" 
    text-anchor="middle"
    font-size="42"
    fill="white"
    font-family="Arial"
  >
    ${text}
  </text>
</svg>
`
}

// ================= MAIN FUNCTION =================
export function generateImages(){

  const BLOG_DIR = "blog"
  const IMG_DIR = "assets/images"

  if(!fs.existsSync(BLOG_DIR)){
    console.log("⚠️ Blog folder not found, skipping images")
    return
  }

  fs.mkdirSync(IMG_DIR, { recursive: true })

  const blogs = fs.readdirSync(BLOG_DIR)

  if(blogs.length === 0){
    console.log("⚠️ No blogs found")
    return
  }

  let count = 0

  blogs.forEach(file => {

    if(!file.endsWith(".html")) return

    const slug = file.replace(".html","")
    const safeText = cleanText(slug)

    const filePath = path.join(IMG_DIR, `${slug}.svg`)

    // skip if already exists
    if(fs.existsSync(filePath)){
      return
    }

    const svg = createSVG(safeText)

    try{
      fs.writeFileSync(filePath, svg)
      count++
    }catch(err){
      console.log("❌ Image error:", slug, err.message)
    }

  })

  console.log(`✅ Images Generated: ${count}`)
}

// ================= DIRECT RUN =================
if (process.argv[1].includes("generate-images.js")) {
  generateImages()
}