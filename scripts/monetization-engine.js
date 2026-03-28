export function injectAds(content){

const adBlock = `
<div style="margin:20px 0;padding:20px;background:#f1f1f1;text-align:center">
Ad Space
</div>
`

const parts = content.split("</p>")

if(parts.length > 3){
parts.splice(2,0,adBlock)
parts.push(adBlock)
}

return parts.join("</p>")
}
export function injectAds(content) {

  const affiliate = `
  <div style="margin:20px 0;padding:10px;border:1px solid #ddd;">
    🔥 Recommended Tool:
    <a href="https://your-affiliate-link.com" target="_blank">
      Best SEO Tool 2026
    </a>
  </div>
  `

  return content.replace("</p>", `</p>${affiliate}`)
}