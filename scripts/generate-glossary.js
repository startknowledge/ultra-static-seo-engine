import fs from "fs"

const terms=[
"base64",
"binary",
"json",
"encoding"
]

if(!fs.existsSync("glossary")){
fs.mkdirSync("glossary")
}

terms.forEach(term=>{

const html=`
<html>

<head>

<title>${term} Meaning</title>

</head>

<body>

<h1>${term}</h1>

<p>${term} definition and explanation.</p>

</body>

</html>
`

fs.writeFileSync(`glossary/${term}.html`,html)

})