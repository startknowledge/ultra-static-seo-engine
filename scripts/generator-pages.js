import fs from "fs"
import { render } from "../core/template-engine.js"

const PAGES_DIR = "pages"

// 🔥 DEFAULT PAGES (ULTRA SEO)
const pages = [
"about",
"privacy-policy",
"terms-and-conditions",
"contact",
"faq",
"disclaimer",
"cookies-policy",
"support",
"documentation",
"changelog"
]

// 🔥 CONTENT GENERATOR
function generateContent(page){

switch(page){

case "about":
return `<p>This website is powered by an advanced AI SEO automation engine that generates content, pages, and tools automatically.</p>`

case "privacy-policy":
return `<p>We respect your privacy. No personal data is stored without consent.</p>`

case "terms-and-conditions":
return `<p>By using this website, you agree to follow all terms and policies.</p>`

case "contact":
return `<p>Contact us via email for any support or queries.</p>`

case "faq":
return `
<h2>FAQs</h2>
<ul>
<li><strong>What is this site?</strong> AI SEO automation platform</li>
<li><strong>Is it free?</strong> Yes</li>
</ul>
`

case "disclaimer":
return `<p>All content is generated automatically for informational purposes.</p>`

case "cookies-policy":
return `<p>This site uses cookies to improve user experience.</p>`

case "support":
return `<p>Support is available via email or contact page.</p>`

case "documentation":
return `<p>Full documentation of tools and system available here.</p>`

case "changelog":
return `<p>All updates and improvements are listed here.</p>`

default:
return `<p>${page} page content</p>`
}

}

// ================= MAIN =================

export async function generatePages(){

if(!fs.existsSync(PAGES_DIR)){
fs.mkdirSync(PAGES_DIR)
}

const template = fs.readFileSync("templates/page-template.html","utf8")

for(const page of pages){

const title = page.replace(/-/g," ")
const slug = `pages/${page}.html`

const content = generateContent(page)

const html = render("templates/page-template.html",{
title: title,
description: `${title} - Learn everything about ${title} with complete guide`,
content: content,
slug: page,
keywords: `${page}, website ${page}`
})

fs.writeFileSync(slug, html)

console.log("✅ Page:",page)

}

}

if (process.argv[1].includes("generator-pages.js")) {
 generatePages()
}