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