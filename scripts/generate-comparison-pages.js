import fs from "fs"

const topics = JSON.parse(
fs.readFileSync("data/tool-topics.json","utf8")
)

const folder="comparison"

if(!fs.existsSync(folder)){
fs.mkdirSync(folder)
}

for(let i=0;i<topics.length;i++){

for(let j=i+1;j<topics.length;j++){

const a=topics[i]
const b=topics[j]

const slugA=a.replace(/\s+/g,"-").toLowerCase()
const slugB=b.replace(/\s+/g,"-").toLowerCase()

const slug=`${slugA}-vs-${slugB}`

const html=`
<!DOCTYPE html>
<html>

<head>

<title>${a} vs ${b}</title>

<meta name="description" content="Comparison between ${a} and ${b}">



</head>

<body>

<h1>${a} vs ${b}</h1>

<p>Detailed comparison between ${a} and ${b}</p>

<h2>${a} Advantages</h2>

<p>${a} has several advantages.</p>

<h2>${b} Advantages</h2>

<p>${b} has several advantages.</p>

<h2>Which is better?</h2>

<p>Both tools have their own use cases.</p>

</body>

</html>
`

fs.writeFileSync(`${folder}/${slug}.html`,html)

}

}

console.log("Comparison pages generated")