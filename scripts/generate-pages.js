import fs from "fs"
import { render } from "./template-engine.js"

const pages = [
"about","privacy-policy","terms-and-conditions",
"contact","disclaimer","cookies-policy",
"support","documentation","changelog","faq"
]

fs.mkdirSync("pages",{recursive:true})

pages.forEach(p=>{

const title = p.replace(/-/g," ")

const content = `
<h2>${title}</h2>
<p>This page explains ${title} of the website.</p>
<p>We ensure transparency, user privacy, and compliance.</p>
`

const html = render("templates/page-template.html",{
title,
description: `${title} page`,
content,
slug: `pages/${p}`,
keyword: title
})

fs.writeFileSync(`pages/${p}.html`,html)

})

console.log("✅ SEO pages generated")