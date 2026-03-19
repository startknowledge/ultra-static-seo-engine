export function generateKeywords(niche){

const base = {
seo: ["seo tools","backlinks","ranking","google seo"],
tools: ["online tools","free tools","web tools"],
"artificial intelligence": ["ai tools","chatgpt alternatives","automation"],
"default": ["technology","software","internet"]
}

return base[niche] || base["default"]
}