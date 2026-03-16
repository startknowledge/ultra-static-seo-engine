import fs from "fs"

const tools = JSON.parse(
fs.readFileSync("data/tool-topics.json","utf8")
)

const folder="tools"

if(!fs.existsSync(folder)){
fs.mkdirSync(folder)
}

tools.forEach(tool=>{

const slug = tool
.toLowerCase()
.replace(/[^a-z0-9\s]/g,"")
.replace(/\s+/g,"-")

const html = `
<!DOCTYPE html>
<html>

<head>

<title>${tool} Tool</title>

<meta name="description" content="Free online ${tool} tool">

</head>

<body>

<h1>${tool}</h1>

<p>This is an automatic generated ${tool} tool page.</p>

</body>

</html>
`

fs.writeFileSync(`${folder}/${slug}.html`,html)

})

console.log("Tools generated")