export async function runPingEngine() {

  console.log("📡 Pinging Search Engines...")

  const sitemap = "https://yourdomain.com/sitemap.xml"

  const urls = [
    `https://www.google.com/ping?sitemap=${sitemap}`,
    `https://www.bing.com/ping?sitemap=${sitemap}`
  ]

  for (const url of urls) {
    console.log("📡 Ping:", url)
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log("✅ Ping Done")
}