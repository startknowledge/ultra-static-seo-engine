import fs from "fs"

const topics = JSON.parse(
fs.readFileSync("data/tool-topics.json","utf8")
)

const folder="programmatic"

if(!fs.existsSync(folder)){
fs.mkdirSync(folder)
}

topics.forEach(topic=>{

const slug = topic
.toLowerCase()
.replace(/\s+/g,"-")

const html=`
<!DOCTYPE html>
<html>

<head>

<title>Best ${topic} Online Tool</title>

<meta name="description" content="Free online ${topic} tool and complete guide">

</head>

<body>

<h1>Best ${topic} Online Tool</h1>

<p>This page explains how to use ${topic} tools online.</p>

</body>

</html>
`

fs.writeFileSync(`${folder}/${slug}.html`,html)

})

console.log("Programmatic pages generated")