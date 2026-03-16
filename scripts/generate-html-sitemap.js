import fs from "fs"

const pagesDir = "pages"
const blogDir = "blog"

let html = `
<!DOCTYPE html>
<html>
<head>
<title>HTML Sitemap</title>
<meta charset="UTF-8">
</head>

<body>

<h1>HTML Sitemap</h1>

<h2>Pages</h2>
<ul>
`

// pages
if (fs.existsSync(pagesDir)) {

const pages = fs.readdirSync(pagesDir)

pages.forEach(page => {

if(page.endsWith(".html")){
html += `<li><a href="/pages/${page}">${page.replace(".html","")}</a></li>`
}

})

}

html += `
</ul>

<h2>Blog</h2>
<ul>
`

// blog
if (fs.existsSync(blogDir)) {

const blogs = fs.readdirSync(blogDir)

blogs.forEach(blog => {

if(blog.endsWith(".html")){
html += `<li><a href="/blog/${blog}">${blog.replace(".html","")}</a></li>`
}

})

}

html += `
</ul>

</body>
</html>
`

fs.writeFileSync("sitemap.html", html)

console.log("HTML sitemap generated")
