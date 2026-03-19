export function pingSearchEngines(){

const urls = [
"https://www.google.com/ping?sitemap=",
"https://www.bing.com/ping?sitemap="
]

urls.forEach(url=>{
console.log("📡 Ping:",url)
})

}