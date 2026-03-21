export function applyLayout(html){

  // ❌ remove inline CSS
  html = html.replace(/<style>[\s\S]*?<\/style>/g,"")

  // ✅ ensure external CSS
  if(!html.includes("style.css")){
    html = html.replace("</head>",`
<link rel="stylesheet" href="/css/style.css">
</head>
`)
  }

  return html
}