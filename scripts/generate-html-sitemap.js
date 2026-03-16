const fs = require("fs")

let files=fs.readdirSync("pages")

let html=`
<!DOCTYPE html>
<html>
<head>
<title>HTML Sitemap</title>
</head>

<body>

<h1>HTML Sitemap</h1>
<ul>
`

files.forEach(f=>{
html+=`<li><a href="/pages/${f}">${f}</a></li>`
})

html+=`
</ul>
</body>
</html>
`

fs.writeFileSync("sitemap.html",html)