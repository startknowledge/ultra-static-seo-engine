import fs from "fs"

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
<rect width="64" height="64" fill="#0d6efd"/>
<text x="50%" y="55%" font-size="32" text-anchor="middle" fill="white">SK</text>
</svg>
`

fs.writeFileSync("assets/images/favicon.svg", svg)

console.log("Favicon generated")
