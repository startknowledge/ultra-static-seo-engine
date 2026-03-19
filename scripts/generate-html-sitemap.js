import fs from "fs"

const folders = ["pages","blog","tools","comparison","glossary"]

let links = ""

folders.forEach(folder=>{
if(!fs.existsSync(folder)) return

fs.readdirSync(folder).forEach(file=>{
if(file.endsWith(".html")){
links += `<li><a href="/${folder}/${file}">${file.replace(".html","")}</a></li>`
}
})
})

const html = `
<!DOCTYPE html>
<html>
<head>
<title>HTML Sitemap</title>
<meta name="robots" content="index, follow">

<style>
body{font-family:sans-serif;background:#f5f5f5;padding:20px}
ul{columns:3}
a{text-decoration:none;color:#2563eb}
</style>

</head>

<body>

<h1>Website Sitemap</h1>
<ul>${links}</ul>

</body>
</html>
`

fs.writeFileSync("sitemap.html",html)

console.log("✅ HTML sitemap enhanced")