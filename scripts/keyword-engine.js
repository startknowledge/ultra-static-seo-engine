export function generateKeywords(niche){

  const base = {
    seo: ["seo tips","on page seo","technical seo","seo tools"],
    tools: ["best tools","free tools","online tools"],
    "artificial intelligence": ["ai tools","ai automation","ai seo"],
    "web development": ["html css","javascript guide","web design"]
  }

  return base[niche] || ["seo","ai","tools"]
}