import fs from "fs"

// ================= MAIN FUNCTION =================
export function generateImages(){

  if(!fs.existsSync("blog")){
    console.log("⚠️ Blog folder not found, skipping images")
    return
  }

  const folder = "assets/images"

  if(!fs.existsSync(folder)){
    fs.mkdirSync(folder, { recursive: true })
  }

  const blogs = fs.readdirSync("blog")

  blogs.forEach(file => {

    const slug = file.replace(".html","")

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#111"/>
<text 
x="50%" 
y="50%" 
dominant-baseline="middle" 
text-anchor="middle"
font-size="48"
fill="white"
font-family="Arial"
>
${slug}
</text>
</svg>
`

    fs.writeFileSync(`${folder}/${slug}.svg`, svg)

  })

  console.log("✅ Images Generated")

}

// ================= DIRECT RUN FIX =================
if (process.argv[1].includes("generate-images.js")) {
  generateImages()
}