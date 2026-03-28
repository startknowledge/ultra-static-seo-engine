export function injectAds(content) {

  const adBlock = `
  <div style="margin:20px 0;padding:20px;background:#f1f1f1;text-align:center;border-radius:8px;">
    📢 Advertisement Space
  </div>
  `

  const affiliateBlock = `
  <div style="margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:8px;">
    🔥 Recommended Tool:
    <a href="https://your-affiliate-link.com" target="_blank">
      Best SEO Tool 2026
    </a>
  </div>
  `

  let parts = content.split("</p>")

  // 🔥 Insert ad after 2nd paragraph
  if (parts.length > 3) {
    parts.splice(2, 0, adBlock)
  }

  // 🔥 Insert affiliate in middle
  if (parts.length > 5) {
    parts.splice(4, 0, affiliateBlock)
  }

  // 🔥 Add one more ad at end
  parts.push(adBlock)

  return parts.join("</p>")
}
export function runMonetization() {
  console.log("💰 Monetization Engine Active")
}